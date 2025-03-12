import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Chip,
  Rating,
  Skeleton,
  Tooltip,
} from "@mui/material";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ParkingSimulator, {
  Simulator3DButton,
  SelectButton,
} from "./ParkingSimulator"; // 导入我们创建的模拟器组件和按钮组件

function SelectParkingLot({ parkingLots, onSelectParkingLot, isLoading }) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState(null);

  // 处理打开模拟器
  const handleOpenSimulator = (lot) => {
    setSelectedLotId(lot.id);
    setShowSimulator(true);
  };

  // 处理关闭模拟器 - 简化逻辑，不再显示结果弹窗
  const handleCloseSimulator = () => {
    setShowSimulator(false);
  };

  // 处理选择停车场
  const handleSelectParkingLot = (lot) => {
    // 调用父组件的回调
    onSelectParkingLot(lot);
  };

  // 渲染停车场卡片
  const renderParkingLotCards = () => {
    if (isLoading) {
      return Array(4)
        .fill(0)
        .map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Skeleton variant="rectangular" height={140} />
              <CardContent sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" height={28} width="80%" />
                <Skeleton variant="text" height={20} width="60%" />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="text" height={24} width="40%" />
                  <Skeleton variant="text" height={24} width="70%" />
                </Box>
              </CardContent>
              <CardActions>
                <Skeleton variant="rectangular" height={36} width="100%" />
              </CardActions>
            </Card>
          </Grid>
        ));
    }

    return parkingLots.map((lot) => (
      <Grid item xs={12} sm={6} md={4} key={lot.id}>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: 6,
            },
            position: "relative",
          }}
        >
          {lot.isAIPick && (
            <Chip
              label="AI PICK"
              color="primary"
              size="small"
              sx={{
                position: "absolute",
                top: 10,
                left: 10,
                fontWeight: "bold",
                backgroundColor: "#2196f3",
                zIndex: 1,
              }}
            />
          )}
          <CardMedia
            component="img"
            height="140"
            image={
              lot.image_url ||
              `https://source.unsplash.com/random/400x200/?parking,${lot.id}`
            }
            alt={lot.name}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="div" gutterBottom>
              {lot.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {lot.address}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", mt: 1, mb: 0.5 }}>
              <Rating
                value={lot.rating || 4.2}
                precision={0.1}
                size="small"
                readOnly
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({lot.review_count || Math.floor(Math.random() * 50) + 10}{" "}
                reviews)
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 2 }}>
              <Chip
                icon={<LocalParkingIcon />}
                label={`${
                  lot.available_spots || Math.floor(Math.random() * 20)
                } available`}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<AccessTimeIcon />}
                label={`$${
                  lot.hourly_rate || Math.floor(Math.random() * 10) + 5
                }/hour`}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<DirectionsCarIcon />}
                label={
                  lot.distance
                    ? `${lot.distance} km`
                    : `${(Math.random() * 2 + 0.1).toFixed(1)} km`
                }
                size="small"
                variant="outlined"
              />
            </Box>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                justifyContent: "flex-end",
                gap: 1.5,
              }}
            >
              {lot.isAIPick && (
                <Simulator3DButton onClick={() => handleOpenSimulator(lot)} />
              )}
              <SelectButton onClick={() => handleSelectParkingLot(lot)} />
            </Box>
          </CardActions>
        </Card>
      </Grid>
    ));
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Select Nearby Parking
      </Typography>

      <Grid container spacing={3}>
        {renderParkingLotCards()}
      </Grid>

      {/* 停车模拟器 - 简化为仅显示3D模型 */}
      <ParkingSimulator
        open={showSimulator}
        onClose={handleCloseSimulator}
        parkingLotId={selectedLotId}
      />
    </Box>
  );
}

export default SelectParkingLot;
