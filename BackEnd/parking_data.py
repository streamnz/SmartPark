# 内存中的停车场数据存储
parking_lots = {}

def get_auckland_destinations():
    """获取奥克兰热门目的地列表"""
    return [
        {
            "id": "auckland_uni",
            "name": "奥克兰大学",
            "address": "22 Princes Street, Auckland CBD",
            "category": "教育",
            "image": "/maps/destinations/auckland_uni.jpg",
            "description": "新西兰最大最古老的大学，位于市中心",
            "location": {"lat": -36.8523, "lng": 174.7691}
        },
        {
            "id": "skycity",
            "name": "Sky City & Sky Tower",
            "address": "Victoria Street West, Auckland CBD",
            "category": "旅游/娱乐",
            "image": "/maps/destinations/skycity.jpg",
            "description": "奥克兰标志性建筑，拥有餐厅、赌场和观景台",
            "location": {"lat": -36.8485, "lng": 174.7630}
        },
        {
            "id": "newmarket",
            "name": "Newmarket购物区",
            "address": "Broadway, Newmarket, Auckland",
            "category": "购物",
            "image": "/maps/destinations/newmarket.jpg",
            "description": "奥克兰高端购物区，拥有众多商店和餐厅",
            "location": {"lat": -36.8735, "lng": 174.7762}
        },
        {
            "id": "auckland_hospital",
            "name": "奥克兰市立医院",
            "address": "2 Park Road, Grafton, Auckland",
            "category": "医疗",
            "image": "/maps/destinations/auckland_hospital.jpg",
            "description": "奥克兰最大的公立医院",
            "location": {"lat": -36.8603, "lng": 174.7703}
        },
        {
            "id": "wynyard_quarter",
            "name": "Wynyard Quarter",
            "address": "Wynyard Quarter, Auckland CBD",
            "category": "休闲/餐饮",
            "image": "/maps/destinations/wynyard_quarter.jpg",
            "description": "奥克兰海滨区，有餐厅、酒吧和公园",
            "location": {"lat": -36.8416, "lng": 174.7566}
        },
        {
            "id": "mt_eden",
            "name": "伊甸山",
            "address": "Mount Eden Road, Mount Eden, Auckland",
            "category": "公园/景点",
            "image": "/maps/destinations/mt_eden.jpg",
            "description": "奥克兰最高的火山锥，提供壮观的城市全景",
            "location": {"lat": -36.8775, "lng": 174.7644}
        },
        {
            "id": "sylvia_park",
            "name": "Sylvia Park购物中心",
            "address": "286 Mount Wellington Highway, Mount Wellington",
            "category": "购物",
            "image": "/maps/destinations/sylvia_park.jpg",
            "description": "新西兰最大的购物中心",
            "location": {"lat": -36.9175, "lng": 174.8417}
        },
        {
            "id": "auckland_zoo",
            "name": "奥克兰动物园",
            "address": "Motions Road, Western Springs, Auckland",
            "category": "休闲/家庭",
            "image": "/maps/destinations/auckland_zoo.jpg",
            "description": "拥有超过135种动物的城市动物园",
            "location": {"lat": -36.8642, "lng": 174.7321}
        },
        {
            "id": "auckland_domain",
            "name": "奥克兰领地公园",
            "address": "Park Road, Grafton, Auckland",
            "category": "公园",
            "image": "/maps/destinations/auckland_domain.jpg",
            "description": "奥克兰最古老最大的公园，内有战争纪念博物馆",
            "location": {"lat": -36.8591, "lng": 174.7730}
        },
        {
            "id": "mission_bay",
            "name": "使命湾海滩",
            "address": "Mission Bay, Auckland",
            "category": "海滩/休闲",
            "image": "/maps/destinations/mission_bay.jpg",
            "description": "受欢迎的海滩和休闲区，有许多餐厅和咖啡馆",
            "location": {"lat": -36.8495, "lng": 174.8262}
        }
    ] 