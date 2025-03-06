# 内存中的停车场数据存储
parking_lots = {}

def get_auckland_destinations():
    """
    获取奥克兰地区的目的地数据，包含更多Google Maps风格的字段
    """
    destinations = [
        {
            "id": 1,
            "name": "Auckland CBD",
            "address": "123 Queen Street, Auckland",
            "category": "Business",
            "availableSpots": 45,
            "location": {"lat": -36.848, "lng": 174.763},
            "placeId": "place_auckland_cbd",
            "rating": 4.5,
            "priceLevel": 3,
            "openNow": True,
            "photos": ["https://example.com/auckland_cbd.jpg"],
            "types": ["point_of_interest", "establishment"]
        },
        {
            "id": 2,
            "name": "Auckland Hospital",
            "address": "2 Park Road, Grafton",
            "category": "Healthcare",
            "availableSpots": 20,
            "location": {"lat": -36.860, "lng": 174.770},
            "placeId": "place_auckland_hospital",
            "rating": 4.2,
            "priceLevel": 2,
            "openNow": True,
            "photos": ["https://example.com/auckland_hospital.jpg"],
            "types": ["hospital", "health"]
        },
        {
            "id": 3,
            "name": "University of Auckland",
            "address": "22 Princes Street, Auckland",
            "category": "Education",
            "availableSpots": 30,
            "location": {"lat": -36.852, "lng": 174.768},
            "placeId": "place_university_auckland",
            "rating": 4.3,
            "priceLevel": 2,
            "openNow": True,
            "photos": ["https://example.com/university_auckland.jpg"],
            "types": ["university", "education"]
        },
        {
            "id": 4,
            "name": "Viaduct Harbour",
            "address": "85 Customs Street West, Auckland",
            "category": "Entertainment",
            "availableSpots": 15,
            "location": {"lat": -36.842, "lng": 174.758},
            "placeId": "place_viaduct_harbour",
            "rating": 4.7,
            "priceLevel": 4,
            "openNow": True,
            "photos": ["https://example.com/viaduct_harbour.jpg"],
            "types": ["tourist_attraction", "point_of_interest"]
        },
        {
            "id": 5,
            "name": "Britomart Transport Centre",
            "address": "12 Queen Street, Auckland",
            "category": "Transportation",
            "availableSpots": 50,
            "location": {"lat": -36.844, "lng": 174.767},
            "placeId": "place_britomart",
            "rating": 4.1,
            "priceLevel": 2,
            "openNow": True,
            "photos": ["https://example.com/britomart.jpg"],
            "types": ["transit_station", "point_of_interest"]
        },
        # 可以添加更多目的地...
    ]
    
    return destinations 