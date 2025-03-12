from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import logging
from .. import database
from ..auth import get_current_user

# 配置日志
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/reservations",
    tags=["reservations"],
)

# 预约数据模型
class ReservationBase(BaseModel):
    parking_lot_id: str
    parking_lot_name: str
    spot_id: str
    spot_type: str
    destination_name: Optional[str] = None
    hourly_rate: float
    reservation_time: datetime
    expiration_time: datetime
    status: Optional[str] = "active"

class ReservationCreate(ReservationBase):
    user_id: str

class ReservationInDB(ReservationBase):
    id: str
    user_id: str
    created_at: datetime

class ReservationResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[dict] = None

class ReservationsListResponse(BaseModel):
    status: str
    data: Optional[List[dict]] = None
    message: Optional[str] = None

# 创建新预约
@router.post("/", response_model=ReservationResponse)
async def create_reservation(reservation: ReservationCreate, current_user = Depends(get_current_user)):
    try:
        # 验证用户
        if reservation.user_id != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot create reservation for another user"
            )
            
        # 保存预约
        result = database.save_reservation(reservation.dict())
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
            
        return result
        
    except Exception as e:
        logger.error(f"Error creating reservation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# 获取用户的所有预约
@router.get("/", response_model=ReservationsListResponse)
async def get_reservations(current_user = Depends(get_current_user)):
    try:
        # 获取用户预约
        result = database.get_user_reservations(current_user["id"])
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
            
        return result
        
    except Exception as e:
        logger.error(f"Error getting reservations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# 取消预约
@router.post("/{reservation_id}/cancel", response_model=ReservationResponse)
async def cancel_reservation(reservation_id: str, current_user = Depends(get_current_user)):
    try:
        # TODO: 验证预约属于当前用户
        
        # 取消预约
        result = database.cancel_reservation(reservation_id)
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
            
        return result
        
    except Exception as e:
        logger.error(f"Error canceling reservation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        ) 