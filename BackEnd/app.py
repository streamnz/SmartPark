from flask import Flask, redirect, url_for, session, request, jsonify
from authlib.integrations.flask_client import OAuth
from flask_cors import CORS
from functools import wraps
import os
import requests
import logging
from dotenv import load_dotenv
from urllib.parse import urlencode

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
    return jsonify({"message": "API service is running", "status": "ok"})

# Token exchange endpoint
@app.route('/api/auth/token', methods=['POST'])
def exchange_token():
    if not request.is_json:
        return jsonify({'error': 'Request must be in JSON format'}), 400
        
    code = request.json.get('code')
    if not code:
        return jsonify({'error': 'Authorization code is required'}), 400
    
    try:
        token_endpoint = f"{COGNITO_DOMAIN}/oauth2/token"
        
        payload = {
            'grant_type': 'authorization_code',
            'client_id': COGNITO_CLIENT_ID,
            'client_secret': COGNITO_CLIENT_SECRET,
            'code': code,
            'redirect_uri': COGNITO_REDIRECT_URI
        }
        
        # 添加详细日志
        logger.info(f"Attempting token exchange with code: {code[:10]}...")
        logger.info(f"Token endpoint: {token_endpoint}")
        logger.info(f"Redirect URI: {COGNITO_REDIRECT_URI}")
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        response = requests.post(
            token_endpoint,
            data=payload,
            headers=headers
        )
        
        if response.status_code != 200:
            logger.error(f"Token exchange failed: {response.status_code}")
            logger.error(f"Response body: {response.text}")
            logger.error(f"Request payload: {payload}")
            return jsonify({'error': 'Token exchange failed', 'details': response.text}), 400
            
        tokens = response.json()
        
        # Get user info using the same domain
        userinfo_endpoint = f"{COGNITO_DOMAIN}/oauth2/userInfo"
        userinfo_response = requests.get(
            userinfo_endpoint,
            headers={'Authorization': f'Bearer {tokens["access_token"]}'}
        )
        
        if userinfo_response.status_code != 200:
            logger.error(f"Failed to get user info: {userinfo_response.status_code} - {userinfo_response.text}")
            return jsonify({'error': 'Failed to get user information'}), 400
            
        user_info = userinfo_response.json()
        
        return jsonify({
            'access_token': tokens['access_token'],
            'id_token': tokens.get('id_token'),
            'refresh_token': tokens.get('refresh_token'),
            'expires_in': tokens.get('expires_in'),
            'user': user_info
        })
    except Exception as e:
        logger.error(f"Error processing authorization code: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

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
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0'
    })

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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    logger.info(f"Starting application: port={port}, debug mode={debug}")
    app.run(debug=debug, host='0.0.0.0', port=port)






