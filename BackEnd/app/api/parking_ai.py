from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
import json
import logging
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("parking_ai")

router = APIRouter()

# 定义请求和响应的数据模型
class ParkingOption(BaseModel):
    id: str
    name: str
    distance_to_destination: int
    available_spots: int
    total_spots: int
    hourly_rate: float

class ParkingRecommendationRequest(BaseModel):
    destination: str
    parkingOptions: List[ParkingOption]

class ParkingRecommendationResponse(BaseModel):
    recommendedParkingId: str
    reason: str

@router.post("/parking-recommendation", response_model=ParkingRecommendationResponse)
async def get_parking_recommendation(request: ParkingRecommendationRequest = Body(...)):
    """
    使用Deepseek API分析并推荐最佳停车场
    """
    # 记录请求参数
    logger.info(f"Received parking recommendation request for destination: {request.destination}")
    request_json = json.dumps(request.dict(), indent=2)
    logger.info(f"Request JSON: {request_json}")
    
    try:
        # 获取API密钥
        api_key = os.getenv('DEEPSEEK_API_KEY')
        if not api_key:
            logger.error("Deepseek API key not configured")
            raise HTTPException(status_code=500, detail="Deepseek API key not configured")
        
        # 初始化客户端
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        
        # 为每个停车场创建英文描述
        parking_descriptions = []
        for p in request.parkingOptions:
            description = f"Parking Name: {p.name}\n" \
                         f"ID: {p.id}\n" \
                         f"Distance to destination: {p.distance_to_destination}m\n" \
                         f"Available spots: {p.available_spots}/{p.total_spots}\n" \
                         f"Hourly rate: ${p.hourly_rate}"
            parking_descriptions.append(description)
        
        # 构建完整的英文提示
        prompt = f"""As a smart parking assistant, please recommend the best parking lot based on the following information:

Destination: {request.destination}

Available Parking Options:
{"".join([f"{i+1}. {desc}\n\n" for i, desc in enumerate(parking_descriptions)])}

Please analyze each parking lot considering distance, available spots, and price to select the optimal option.
Response format:
{{
    "recommendedParkingId": "parking ID", 
    "reason": "recommendation reason in 20 words or less"
}}

Note: Only return the JSON format without any additional text.
"""
        logger.info(f"Prompt sent to Deepseek API:\n{prompt}")
        
        # 调用Deepseek API
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a professional parking recommendation assistant. Analyze the data provided and make the most logical recommendation. Always respond in English."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300
        )
        
        # 解析API返回的内容
        content = response.choices[0].message.content
        logger.info(f"Deepseek API raw response: {content}")
        
        recommendation = json.loads(content)
        logger.info(f"Parsed recommendation: {json.dumps(recommendation, indent=2)}")
        
        # 验证返回的ID是否存在于选项中
        valid_ids = [p.id for p in request.parkingOptions]
        if recommendation.get("recommendedParkingId") not in valid_ids:
            # 如果API返回的ID不存在，默认选择第一个
            logger.warning(f"Invalid parking ID returned: {recommendation.get('recommendedParkingId')}. Using default.")
            recommendation["recommendedParkingId"] = request.parkingOptions[0].id
            recommendation["reason"] = "Closest option with sufficient available spots"
        
        # 记录最终响应
        logger.info(f"Final recommendation response: {json.dumps(recommendation, indent=2)}")
        return recommendation
        
    except Exception as e:
        # 错误处理，返回默认推荐
        logger.error(f"Error processing recommendation: {str(e)}", exc_info=True)
        default_parking = request.parkingOptions[0] if request.parkingOptions else None
        if not default_parking:
            raise HTTPException(status_code=404, detail="No available parking lots")
        
        default_response = {
            "recommendedParkingId": default_parking.id,
            "reason": "Closest option with sufficient available spots"
        }
        logger.info(f"Using default recommendation: {json.dumps(default_response, indent=2)}")
        return default_response 