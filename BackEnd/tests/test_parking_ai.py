import os
import sys
import json
import logging
from fastapi.testclient import TestClient
import pytest
from dotenv import load_dotenv

# 配置日志
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("test_parking_ai")

# 添加父目录到模块搜索路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入FastAPI应用
from app.main import app

# 加载环境变量
load_dotenv()

# 创建测试客户端
client = TestClient(app)

def test_parking_recommendation_api():
    """Test if the parking recommendation API works correctly"""
    
    # 准备测试数据
    mock_parking_options = [
        {
            "id": "parking_1",
            "name": "Auckland CBD Parking A",
            "distance_to_destination": 150,
            "available_spots": 25,
            "total_spots": 80,
            "hourly_rate": 5.50
        },
        {
            "id": "parking_2",
            "name": "Downtown Parking",
            "distance_to_destination": 220,
            "available_spots": 15,
            "total_spots": 60,
            "hourly_rate": 4.00
        },
        {
            "id": "parking_3",
            "name": "Premium Parking",
            "distance_to_destination": 280,
            "available_spots": 8, 
            "total_spots": 40,
            "hourly_rate": 7.50
        }
    ]
    
    # 记录请求数据
    request_data = {
        "destination": "Auckland University",
        "parkingOptions": mock_parking_options
    }
    logger.info(f"Test request data: {json.dumps(request_data, indent=2)}")
    
    # 发送POST请求到API
    response = client.post(
        "/api/parking-recommendation",
        json=request_data
    )
    
    # 检查响应状态
    logger.info(f"Response status code: {response.status_code}")
    logger.info(f"Response content: {response.text}")
    
    # 验证响应
    assert response.status_code == 200
    data = response.json()
    assert "recommendedParkingId" in data
    assert "reason" in data
    
    # 验证推荐的停车场ID是有效的
    assert data["recommendedParkingId"] in ["parking_1", "parking_2", "parking_3"]
    
    # 验证推荐理由不为空
    assert len(data["reason"]) > 0
    
    logger.info(f"Recommended parking ID: {data['recommendedParkingId']}")
    logger.info(f"Recommendation reason: {data['reason']}")
    
    return True

if __name__ == "__main__":
    # 检查是否存在Deepseek API密钥
    api_key = os.getenv('DEEPSEEK_API_KEY')
    if not api_key:
        logger.error("Error: DEEPSEEK_API_KEY environment variable not found. Please set it in your .env file.")
        sys.exit(1)
        
    logger.info("Starting parking AI recommendation API test...")
    success = test_parking_recommendation_api()
    
    if success:
        logger.info("\n✅ Test successful!")
    else:
        logger.error("\n❌ Test failed!") 