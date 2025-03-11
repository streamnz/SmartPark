from flask import Flask, redirect, url_for, session, request, jsonify
from authlib.integrations.flask_client import OAuth
from flask_cors import CORS
from functools import wraps
import os
import requests
import logging
from dotenv import load_dotenv
from urllib.parse import urlencode
from utils.ai_service import get_ai_recommendation, reroute_recommendation
from parking_data import parking_lots, get_auckland_destinations
import random
import json

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# 从环境变量获取密钥，如果不存在则生成一个（仅用于开发环境）
app.secret_key = os.environ.get('FLASK_SECRET_KEY', os.urandom(24))

# 配置CORS - 在生产环境中应该限制origins
CORS(app, resources={r"/api/*": {"origins": os.environ.get('ALLOWED_ORIGINS', '*')}})

# 从环境变量获取Cognito配置
COGNITO_REGION = os.environ.get('COGNITO_REGION', 'ap-southeast-2')
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', 'ap-southeast-2_BXhdoWuDl')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID', '4r2ui82gb5gigfrfjl18tq1i6i')
COGNITO_CLIENT_SECRET = os.environ.get('COGNITO_CLIENT_SECRET', 'h1bsjhhc0skjr9leug1tkru3upe4s1hsqj01qnbplhc2k6819c2')
COGNITO_DOMAIN = f"https://ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com"
COGNITO_REDIRECT_URI = os.environ.get('COGNITO_REDIRECT_URI', 'http://localhost:5173/authorize')

# 配置OAuth
oauth = OAuth(app)
oauth.register(
    name='cognito',
    server_metadata_url=f'{COGNITO_DOMAIN}/.well-known/openid-configuration',
    client_id=COGNITO_CLIENT_ID,
    client_secret=COGNITO_CLIENT_SECRET,
    client_kwargs={'scope': 'email openid phone profile'}
)

# Token verification middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            logger.warning("Request missing Authorization header")
            return jsonify({'error': 'Authentication token not provided'}), 401
            
        try:
            # Check format
            parts = auth_header.split()
            if parts[0].lower() != 'bearer' or len(parts) != 2:
                return jsonify({'error': 'Invalid authentication header format'}), 401
                
            token = parts[1]
            
            # Verify token
            userinfo_endpoint = f'{COGNITO_DOMAIN}/userInfo'
            response = requests.get(
                userinfo_endpoint,
                headers={'Authorization': f'Bearer {token}'}
            )
            
            if response.status_code != 200:
                logger.warning(f"Token verification failed: {response.status_code} - {response.text}")
                return jsonify({'error': 'Invalid token'}), 401
                
            user_info = response.json()
            return f(*args, **kwargs, user=user_info)
        except Exception as e:
            logger.error(f"Token verification exception: {str(e)}", exc_info=True)
            return jsonify({'error': 'Authentication processing failed'}), 500
            
    return decorated

# Root route
@app.route('/')
def index():
    return jsonify({
        "status": "success",
        "message": "SmartPark Auckland API is running",
        "version": "1.0.0"
    })

# Token exchange endpoint
@app.route('/api/auth/token', methods=['POST'])
def exchange_token():
    if not request.is_json:
        return jsonify({'error': 'Request must be in JSON format'}), 400
        
    code = request.json.get('code')
    
    if not code:
        return jsonify({'error': 'Authorization code is required'}), 400
    
    # 从请求中获取redirect_uri，如果没有提供则使用默认值
    redirect_uri = request.json.get('redirect_uri', COGNITO_REDIRECT_URI)
    logger.info(f"Using redirect_uri: {redirect_uri}")
    
    try:
        token_endpoint = f'{COGNITO_DOMAIN}/oauth2/token'
        
        # 添加客户端认证
        auth = (COGNITO_CLIENT_ID, COGNITO_CLIENT_SECRET)
        
        payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri  # 使用请求中提供的redirect_uri
        }
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        response = requests.post(
            token_endpoint,
            data=payload,
            headers=headers,
            auth=auth  # 使用基本认证
        )
        
        # Print response info for debugging
        logger.info(f"Token exchange response status: {response.status_code}")
        logger.info(f"Token exchange response content: {response.text}")
        
        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
            return jsonify({'error': f'Token exchange failed: {response.status_code} - {response.text}'}), 400
            
        tokens = response.json()
        
        # Get user info
        userinfo_endpoint = f'{COGNITO_DOMAIN}/oauth2/userInfo'
        userinfo_response = requests.get(
            userinfo_endpoint,
            headers={'Authorization': f'Bearer {tokens["access_token"]}'}
        )
        
        if userinfo_response.status_code != 200:
            logger.error(f"Failed to get user information: {userinfo_response.status_code} - {userinfo_response.text}")
            return jsonify({'error': f'Failed to get user information: {userinfo_response.status_code} - {userinfo_response.text}'}), 400
            
        user_info = userinfo_response.json()
        
        return jsonify({
            'access_token': tokens['access_token'],
            'id_token': tokens.get('id_token'),
            'refresh_token': tokens.get('refresh_token'),
            'expires_in': tokens.get('expires_in'),
            'user': user_info
        })
    except Exception as e:
        import traceback
        logger.error(f"Error processing authorization code: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Error processing authorization code: {str(e)}'}), 500

# Protected user profile route
@app.route('/api/user/profile')
@token_required
def get_user_profile(user):
    return jsonify({
        'success': True,
        'user': user
    })

# Update user profile route
@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile(user):
    if not request.is_json:
        return jsonify({'error': 'Request must be in JSON format'}), 400
        
    data = request.json
    # Add logic to update user profile here
    logger.info(f"Updating user profile: {user.get('sub')} - {data}")
    
    return jsonify({
        'success': True,
        'message': 'User profile updated'
    })

# Health check endpoint
@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy'})

# Login endpoint
@app.route('/api/auth/login')
def initiate_login():
    auth_url = f"{COGNITO_DOMAIN}/oauth2/authorize"  # 修改为 oauth2/authorize
    params = {
        'client_id': COGNITO_CLIENT_ID,
        'response_type': 'code',
        'scope': 'email openid phone profile',  # 添加 scope
        'redirect_uri': COGNITO_REDIRECT_URI    # 使用配置的 redirect_uri
    }
    
    return redirect(f"{auth_url}?{urlencode(params)}")

@app.route('/api/auth/logout')
def logout():
    """
    Handle user logout by redirecting to Cognito logout endpoint
    """
    try:
        # Build the logout URL
        logout_url = f"{COGNITO_DOMAIN}/logout"
        params = {
            'client_id': COGNITO_CLIENT_ID,
            'logout_uri': COGNITO_REDIRECT_URI  # Redirect back to frontend after logout
        }
        
        # Log the logout URL for debugging
        full_logout_url = f"{logout_url}?{urlencode(params)}"
        logger.info(f"Redirecting to logout URL: {full_logout_url}")
        
        # Redirect to Cognito logout page
        return redirect(full_logout_url)
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        return jsonify({'error': f'Error during logout: {str(e)}'}), 500

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get available vehicle types"""
    vehicles = [
        {
            "id": "sedan",
            "name": "Sedan",
            "description": "Standard four-door sedan, suitable for city driving",
            "image": "/models/thumbnails/sedan.jpg",
            "width": 1.8,
            "length": 4.5,
            "height": 1.5,
            "model_path": "/models/sedan.glb"
        },
        {
            "id": "suv",
            "name": "SUV",
            "description": "Sport Utility Vehicle, providing more space and clearance",
            "image": "/models/thumbnails/suv.jpg",
            "width": 1.9,
            "length": 4.7,
            "height": 1.7,
            "model_path": "/models/suv.glb"
        },
        {
            "id": "pickup",
            "name": "Pickup Truck",
            "description": "Truck with an open-air cargo area",
            "image": "/models/thumbnails/pickup.jpg",
            "width": 2.0,
            "length": 5.3,
            "height": 1.9,
            "model_path": "/models/pickup.glb"
        },
        {
            "id": "van",
            "name": "Van",
            "description": "Enclosed box-like vehicle suitable for transporting goods",
            "image": "/models/thumbnails/van.jpg",
            "width": 2.0,
            "length": 5.5,
            "height": 2.2,
            "model_path": "/models/van.glb"
        },
        {
            "id": "truck",
            "name": "Truck",
            "description": "Large transport vehicle with ample space",
            "image": "/models/thumbnails/truck.jpg",
            "width": 2.5,
            "length": 7.0,
            "height": 2.8,
            "model_path": "/models/truck.glb"
        },
        {
            "id": "rv",
            "name": "RV",
            "description": "Recreational Vehicle with living space, suitable for long journeys",
            "image": "/models/thumbnails/rv.jpg",
            "width": 2.3,
            "length": 6.8,
            "height": 3.0,
            "model_path": "/models/rv.glb"
        }
    ]
    
    return jsonify({"status": "success", "data": vehicles})

@app.route('/api/destinations', methods=['GET'])
def get_destinations():
    """获取奥克兰热门目的地"""
    destinations = get_auckland_destinations()
    return jsonify({"status": "success", "data": destinations})

@app.route('/api/parking-lots/nearby', methods=['GET'])
def get_nearby_parking_lots():
    """获取目的地附近的停车场"""
    lat = float(request.args.get('lat', -36.8485))
    lng = float(request.args.get('lng', 174.7630))
    radius = float(request.args.get('radius', 1000))  # 默认1公里半径
    
    # 简单模拟：为每个请求的位置生成一个附近停车场
    destination_name = request.args.get('name', '未知位置')
    
    # 生成一个随机但稳定的停车场ID (基于位置)
    lot_id = f"parking_{int((lat+36)*1000)}_{int((lng-174)*1000)}"
    
    nearby_lot = {
        "id": lot_id,
        "name": f"{destination_name}停车场",
        "location": {
            "lat": lat + random.uniform(-0.001, 0.001),
            "lng": lng + random.uniform(-0.001, 0.001)
        },
        "total_spots": random.randint(50, 300),
        "available_spots": random.randint(10, 50),
        "hourly_rate": round(random.uniform(2, 8), 1),
        "distance_to_destination": int(random.uniform(50, 300)),
        "features": random.sample(["covered", "security", "disabled_access", 
                                   "ev_charging", "valet", "24h"], 
                                 k=random.randint(2, 4))
    }
    
    return jsonify({
        "status": "success", 
        "data": {"parkings": [nearby_lot]}
    })

@app.route('/api/parking-lot/<lot_id>', methods=['GET'])
def get_parking_lot(lot_id):
    """获取停车场详情和布局"""
    if lot_id not in parking_lots:
        # 如果还没有这个停车场，生成一个新的
        rows = random.randint(6, 10)
        cols = random.randint(8, 12)
        
        # 创建新停车场
        parking_lot = {
            "id": lot_id,
            "name": f"停车场 {lot_id}",
            "rows": rows,
            "cols": cols,
            "entrance": {"row": 0, "col": cols // 2},
            "exit": {"row": rows - 1, "col": cols // 2},
            "spots": {}
        }
        
        # 生成车位
        occupied_count = int(rows * cols * 0.7)  # 70%的车位已占用
        for row in range(rows):
            for col in range(cols):
                # 跳过入口和出口位置
                if ((row == 0 and col == cols // 2) or 
                    (row == rows - 1 and col == cols // 2)):
                    continue
                
                spot_id = f"spot_{row}_{col}"
                is_occupied = occupied_count > 0
                if is_occupied:
                    occupied_count -= 1
                
                # 随机指定一些特殊车位类型
                spot_type = "standard"
                if random.random() < 0.1:
                    spot_type = random.choice(["disabled", "ev_charging", "compact", "large"])
                
                parking_lot["spots"][spot_id] = {
                    "id": spot_id,
                    "row": row,
                    "col": col,
                    "type": spot_type,
                    "is_occupied": is_occupied,
                    "distance_to_entrance": abs(row) + abs(col - cols // 2),
                    "distance_to_exit": abs(row - (rows - 1)) + abs(col - cols // 2)
                }
        
        # 保存到内存中的停车场数据
        parking_lots[lot_id] = parking_lot
    
    return jsonify({"status": "success", "data": parking_lots[lot_id]})

@app.route('/api/allocate-spot', methods=['POST'])
def allocate_spot():
    """为车辆分配最佳停车位"""
    data = request.json
    lot_id = data.get('parking_id')
    vehicle_info = data.get('vehicle_info', {})
    destination = data.get('destination', {})
    user_preferences = data.get('user_preferences', {})
    
    if lot_id not in parking_lots:
        return jsonify({"status": "error", "message": "Parking lot not found"}), 404
    
    # 获取可用车位
    available_spots = [
        spot for spot_id, spot in parking_lots[lot_id]["spots"].items()
        if not spot["is_occupied"]
    ]
    
    if not available_spots:
        return jsonify({"status": "error", "message": "No available spots"}), 400
    
    # 使用AI服务获取推荐
    recommendation = get_ai_recommendation(
        available_spots, 
        vehicle_info, 
        user_preferences, 
        parking_lots[lot_id]
    )
    
    # 标记车位为已占用
    spot_id = recommendation["spot"]["id"]
    parking_lots[lot_id]["spots"][spot_id]["is_occupied"] = True
    
    return jsonify({
        "status": "success",
        "data": recommendation
    })

@app.route('/api/reroute-spot', methods=['POST'])
def reroute_spot():
    """重新路由到新的停车位"""
    data = request.json
    lot_id = data.get('parking_id')
    vehicle_info = data.get('vehicle_info', {})
    current_position = data.get('current_position', [0, 0, 0])
    destination = data.get('destination', {})
    
    if lot_id not in parking_lots:
        return jsonify({"status": "error", "message": "Parking lot not found"}), 404
    
    # 获取可用车位
    available_spots = [
        spot for spot_id, spot in parking_lots[lot_id]["spots"].items()
        if not spot["is_occupied"]
    ]
    
    if not available_spots:
        return jsonify({"status": "error", "message": "No available spots"}), 400
    
    # 使用AI服务获取新推荐
    new_recommendation = reroute_recommendation(
        available_spots, 
        vehicle_info, 
        current_position, 
        destination,
        parking_lots[lot_id]
    )
    
    # 标记新车位为已占用
    spot_id = new_recommendation["spot"]["id"]
    parking_lots[lot_id]["spots"][spot_id]["is_occupied"] = True
    
    return jsonify({
        "status": "success",
        "data": new_recommendation
    })

@app.route('/api/reset-parking-lot/<lot_id>', methods=['POST'])
def reset_parking_lot(lot_id):
    """重置停车场（所有车位变为可用）"""
    if lot_id in parking_lots:
        for spot_id in parking_lots[lot_id]["spots"]:
            parking_lots[lot_id]["spots"][spot_id]["is_occupied"] = False
    
    return jsonify({"status": "success", "message": f"Parking lot {lot_id} reset"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    logger.info(f"Starting application: port={port}, debug mode={debug}")
    app.run(debug=debug, host='0.0.0.0', port=port)






