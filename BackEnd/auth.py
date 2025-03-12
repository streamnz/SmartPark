import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import logging
import requests
from jose import jwk, jwt as jose_jwt
from jose.utils import base64url_decode
import json
from typing import Dict, Any, Optional

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 安全依赖
security = HTTPBearer()

# 从环境变量获取Cognito配置
COGNITO_REGION = os.environ.get('COGNITO_REGION', 'ap-southeast-2')
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID', 'ap-southeast-2_BXhdoWuDl')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID', '4r2ui82gb5gigfrfjl18tq1i6i')
COGNITO_DOMAIN = f"https://ap-southeast-2bxhdowudl.auth.ap-southeast-2.amazoncognito.com"

# 缓存JWKS以避免频繁请求
jwks_cache = None
jwks_cache_time = 0

def get_jwks():
    global jwks_cache, jwks_cache_time
    import time
    
    # 如果缓存的JWKS不存在或已过期（1小时），则刷新
    current_time = time.time()
    if jwks_cache is None or (current_time - jwks_cache_time) > 3600:
        jwks_url = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json'
        logger.info(f"Fetching JWKS from: {jwks_url}")
        
        response = requests.get(jwks_url)
        jwks_cache = response.json()
        jwks_cache_time = current_time
        
    return jwks_cache

def decode_token(token: str) -> Dict[str, Any]:
    """
    解码并验证JWT令牌
    """
    try:
        # 获取令牌的头部（未验证）
        header = jose_jwt.get_unverified_header(token)
        
        # 获取JWKS
        jwks = get_jwks()
        
        # 查找对应的公钥
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == header.get("kid"):
                rsa_key = {
                    "kty": key.get("kty"),
                    "kid": key.get("kid"),
                    "use": key.get("use"),
                    "n": key.get("n"),
                    "e": key.get("e")
                }
                break
        
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key",
            )
        
        # 验证令牌
        payload = jose_jwt.decode(
            token,
            rsa_key,
            algorithms=[header.get("alg", "RS256")],
            audience=COGNITO_CLIENT_ID,
            options={"verify_exp": True}
        )
        
        return payload
        
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    从HTTP头中提取认证令牌，解码并返回用户信息
    """
    try:
        token = credentials.credentials
        payload = decode_token(token)
        
        # 从Cognito令牌构建用户信息
        user_info = {
            "id": payload.get("sub"),
            "email": payload.get("email", ""),
            "name": payload.get("name", ""),
            "cognito:groups": payload.get("cognito:groups", []),
            "token": token
        }
        
        return user_info
        
    except Exception as e:
        logger.error(f"Error extracting user info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

# 简化版：用于后端测试，无需进行完整验证
def get_test_user():
    """用于测试的用户信息，仅在开发环境使用"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
    } 