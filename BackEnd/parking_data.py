# 内存中的停车场数据存储
parking_lots = {}

def get_auckland_destinations():
    """Returns popular destinations in Auckland in English"""
    destinations = [
        {
            "id": 1,
            "name": "University of Auckland",
            "address": "22 Princes Street, Auckland CBD",
            "category": "Education",
            "description": "New Zealand's largest and oldest university, located in the city center",
            "location": {"lat": -36.8523, "lng": 174.7691}
        },
        {
            "id": 2,
            "name": "Auckland City Hospital",
            "address": "2 Park Road, Grafton, Auckland",
            "category": "Medical",
            "description": "Auckland's largest public hospital",
            "location": {"lat": -36.8601, "lng": 174.7695}
        },
        {
            "id": 3,
            "name": "Newmarket Shopping District",
            "address": "Broadway, Newmarket, Auckland",
            "category": "Shopping",
            "description": "Auckland's premium shopping district with numerous stores and restaurants",
            "location": {"lat": -36.8709, "lng": 174.7776}
        },
        {
            "id": 4,
            "name": "Sky City & Sky Tower",
            "address": "Victoria Street West, Auckland CBD",
            "category": "Tourism/Entertainment",
            "description": "Auckland's iconic landmark with restaurants, casino and observation deck",
            "location": {"lat": -36.8477, "lng": 174.7633}
        },
        {
            "id": 5, 
            "name": "Wynyard Quarter",
            "address": "Wynyard Quarter, Auckland CBD",
            "category": "Leisure/Dining",
            "description": "Auckland's waterfront area with restaurants, bars and parks",
            "location": {"lat": -36.8414, "lng": 174.7566}
        },
        {
            "id": 6,
            "name": "Mount Eden",
            "address": "Mount Eden Road, Mount Eden, Auckland",
            "category": "Parks/Attractions",
            "description": "Auckland's highest volcanic cone offering spectacular city views",
            "location": {"lat": -36.8774, "lng": 174.7650}
        },
        {
            "id": 7,
            "name": "Sylvia Park Shopping Centre",
            "address": "286 Mount Wellington Highway, Mount Wellington",
            "category": "Shopping",
            "description": "New Zealand's largest shopping mall",
            "location": {"lat": -36.9170, "lng": 174.8435}
        },
        {
            "id": 8,
            "name": "Auckland Zoo",
            "address": "Motions Road, Western Springs, Auckland",
            "category": "Leisure/Family",
            "description": "Urban zoo with over 135 species of animals",
            "location": {"lat": -36.8646, "lng": 174.7284}
        },
        {
            "id": 9,
            "name": "Auckland Domain",
            "address": "Park Road, Grafton, Auckland",
            "category": "Parks",
            "description": "Auckland's oldest and largest park, home to the War Memorial Museum",
            "location": {"lat": -36.8591, "lng": 174.7762}
        },
        # 添加更多目的地数据
        {
            "id": 10,
            "name": "Auckland War Memorial Museum",
            "address": "Auckland Domain, Parnell, Auckland",
            "category": "Tourism/Entertainment",
            "description": "New Zealand's first museum with extensive collections on Maori and Pacific history",
            "location": {"lat": -36.8606, "lng": 174.7770}
        },
        {
            "id": 11,
            "name": "Middlemore Hospital",
            "address": "100 Hospital Road, Otahuhu, Auckland",
            "category": "Medical",
            "description": "One of Auckland's largest hospitals serving South Auckland",
            "location": {"lat": -36.9543, "lng": 174.8394}
        },
        {
            "id": 12,
            "name": "North Shore Hospital",
            "address": "Shakespeare Road, Takapuna, Auckland",
            "category": "Medical",
            "description": "Major hospital serving Auckland's North Shore district",
            "location": {"lat": -36.7878, "lng": 174.7561}
        },
        {
            "id": 13,
            "name": "Commercial Bay",
            "address": "7 Queen Street, Auckland CBD",
            "category": "Shopping",
            "description": "Modern shopping precinct in downtown Auckland with boutique stores and restaurants",
            "location": {"lat": -36.8440, "lng": 174.7675}
        },
        {
            "id": 14,
            "name": "Westfield Albany",
            "address": "219 Don McKinnon Drive, Albany, Auckland",
            "category": "Shopping",
            "description": "Large shopping center in Auckland's North Shore with over 140 stores",
            "location": {"lat": -36.7309, "lng": 174.7151}
        },
        {
            "id": 15,
            "name": "Westfield Newmarket",
            "address": "277 Broadway, Newmarket, Auckland",
            "category": "Shopping",
            "description": "Modern multi-level shopping center with premium brands and dining options",
            "location": {"lat": -36.8727, "lng": 174.7772}
        },
        {
            "id": 16,
            "name": "AUT University",
            "address": "55 Wellesley Street East, Auckland CBD",
            "category": "Education",
            "description": "Auckland's second largest university with a focus on industry-relevant programs",
            "location": {"lat": -36.8532, "lng": 174.7671}
        },
        {
            "id": 17,
            "name": "Kelly Tarlton's Sea Life Aquarium",
            "address": "23 Tamaki Drive, Orakei, Auckland",
            "category": "Leisure/Family",
            "description": "Underwater aquarium showcasing marine life with Antarctic penguin colony",
            "location": {"lat": -36.8454, "lng": 174.8199}
        },
        {
            "id": 18,
            "name": "Auckland Botanic Gardens",
            "address": "102 Hill Road, Manurewa, Auckland",
            "category": "Parks",
            "description": "64 hectares of beautiful gardens featuring native and exotic plants",
            "location": {"lat": -37.0133, "lng": 174.9084}
        },
        {
            "id": 19,
            "name": "Mission Bay Beach",
            "address": "Mission Bay, Auckland",
            "category": "Beach/Leisure",
            "description": "Popular beach area with restaurants and recreational facilities",
            "location": {"lat": -36.8513, "lng": 174.8330}
        },
        {
            "id": 20,
            "name": "Auckland Art Gallery",
            "address": "Corner Kitchener and Wellesley Streets, Auckland CBD",
            "category": "Tourism/Entertainment",
            "description": "New Zealand's largest art institution with over 15,000 works",
            "location": {"lat": -36.8517, "lng": 174.7653}
        },
        {
            "id": 21,
            "name": "MOTAT (Museum of Transport and Technology)",
            "address": "805 Great North Road, Western Springs, Auckland",
            "category": "Tourism/Entertainment",
            "description": "Interactive technology and transportation museum with historic exhibits",
            "location": {"lat": -36.8668, "lng": 174.7249}
        },
        {
            "id": 22,
            "name": "Viaduct Harbour",
            "address": "Viaduct Harbour, Auckland CBD",
            "category": "Leisure/Dining",
            "description": "Upscale waterfront area with restaurants, bars and superyacht marina",
            "location": {"lat": -36.8436, "lng": 174.7617}
        },
        {
            "id": 23,
            "name": "One Tree Hill",
            "address": "670 Manukau Road, Epsom, Auckland",
            "category": "Parks/Attractions",
            "description": "Iconic volcanic peak with historic significance and panoramic views",
            "location": {"lat": -36.9012, "lng": 174.7833}
        },
        {
            "id": 24,
            "name": "Waiheke Island",
            "address": "Waiheke Island, Auckland",
            "category": "Tourism/Entertainment",
            "description": "Island in the Hauraki Gulf known for wineries, beaches and art galleries",
            "location": {"lat": -36.8010, "lng": 175.1084}
        },
        {
            "id": 25,
            "name": "DressSmart Onehunga",
            "address": "151 Arthur Street, Onehunga, Auckland",
            "category": "Shopping",
            "description": "Outlet shopping center with discounted brand-name products",
            "location": {"lat": -36.9178, "lng": 174.7829}
        },
        {
            "id": 26,
            "name": "Cornwall Park",
            "address": "Green Lane West, Epsom, Auckland",
            "category": "Parks",
            "description": "Large parkland with walking trails, historic farm and recreational areas",
            "location": {"lat": -36.8946, "lng": 174.7872}
        },
        {
            "id": 27,
            "name": "Auckland Surgical Centre",
            "address": "9 St Marks Road, Remuera, Auckland",
            "category": "Medical",
            "description": "Private surgical hospital offering specialized procedures",
            "location": {"lat": -36.8769, "lng": 174.8019}
        },
        {
            "id": 28,
            "name": "Britomart",
            "address": "29 Galway Street, Auckland CBD",
            "category": "Shopping",
            "description": "Downtown precinct with designer stores, restaurants and transport hub",
            "location": {"lat": -36.8445, "lng": 174.7687}
        },
        {
            "id": 29,
            "name": "Rainbows End",
            "address": "2 Clist Crescent, Manukau, Auckland",
            "category": "Leisure/Family",
            "description": "New Zealand's largest theme park with rides and attractions for all ages",
            "location": {"lat": -36.9892, "lng": 174.8797}
        },
        {
            "id": 30,
            "name": "Devonport",
            "address": "Devonport, Auckland",
            "category": "Tourism/Entertainment",
            "description": "Historic seaside village with Victorian architecture and naval museum",
            "location": {"lat": -36.8271, "lng": 174.7963}
        }
    ]
    return destinations 