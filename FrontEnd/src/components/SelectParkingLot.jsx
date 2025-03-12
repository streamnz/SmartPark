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
  useMediaQuery,
  useTheme,
  Divider,
  IconButton,
} from "@mui/material";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RecommendIcon from "@mui/icons-material/Recommend";
import ParkingSimulator, {
  Simulator3DButton,
  SelectButton,
} from "./ParkingSimulator"; // 导入我们创建的模拟器组件和按钮组件

function SelectParkingLot({ parkingLots, onSelectParkingLot, isLoading }) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

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

  // 移动端优化的自定义按钮组件
  const MobileActionButton = ({ onClick, isPrimary, children }) => (
    <Button
      variant={isPrimary ? "contained" : "outlined"}
      size="small"
      onClick={onClick}
      fullWidth
      sx={{
        py: 0.5,
        fontSize: "0.75rem",
        color: isPrimary ? "white" : "rgba(255,255,255,0.7)",
        borderColor: isPrimary ? "none" : "rgba(255,255,255,0.3)",
        backgroundColor: isPrimary ? "#1A73E8" : "transparent",
        "&:hover": {
          backgroundColor: isPrimary ? "#1765CC" : "rgba(255,255,255,0.05)",
          borderColor: isPrimary ? "none" : "rgba(255,255,255,0.5)",
        },
        "&:active": {
          transform: "scale(0.98)",
          transition: "transform 0.1s",
        },
        textTransform: "none",
        whiteSpace: "nowrap",
        borderRadius: 1,
      }}
    >
      {children}
    </Button>
  );

  // 骨架屏加载状态 - 针对移动端优化
  const renderSkeletons = () => {
    return Array(isMobile ? 3 : isTablet ? 4 : 6)
      .fill(0)
      .map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: isMobile ? 1 : 2,
            }}
          >
            <Skeleton variant="rectangular" height={isMobile ? 120 : 140} />
            <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.5 : 2 }}>
              <Skeleton
                variant="text"
                height={isMobile ? 24 : 28}
                width="80%"
              />
              <Skeleton
                variant="text"
                height={isMobile ? 16 : 20}
                width="60%"
              />
              <Box sx={{ mt: 1.5 }}>
                <Skeleton
                  variant="text"
                  height={isMobile ? 20 : 24}
                  width="40%"
                />
                <Skeleton
                  variant="text"
                  height={isMobile ? 20 : 24}
                  width="70%"
                />
              </Box>
            </CardContent>
            <CardActions sx={{ p: isMobile ? 1.5 : 2 }}>
              <Skeleton
                variant="rectangular"
                height={isMobile ? 30 : 36}
                width="100%"
              />
            </CardActions>
          </Card>
        </Grid>
      ));
  };

  // 渲染停车场卡片 - 移动端优化版本
  const renderParkingLotCards = () => {
    if (isLoading) {
      return renderSkeletons();
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
              transform: isMobile ? "none" : "translateY(-4px)",
              boxShadow: isMobile ? 1 : 6,
            },
            "&:active": isMobile
              ? {
                  transform: "scale(0.99)",
                  transition: "transform 0.1s",
                }
              : {},
            position: "relative",
            borderRadius: isMobile ? 1 : 2,
            overflow: "hidden",
            bgcolor: "rgba(32,33,36,0.9)",
          }}
        >
          {lot.isAIPick && (
            <Chip
              icon={!isMobile && <RecommendIcon fontSize="small" />}
              label={isMobile ? "AI推荐" : "AI推荐停车场"}
              color="primary"
              size="small"
              sx={{
                position: "absolute",
                top: 10,
                left: 10,
                fontWeight: "bold",
                backgroundColor: "#2196f3",
                zIndex: 1,
                height: isMobile ? 20 : 24,
                fontSize: isMobile ? "0.65rem" : "0.75rem",
                px: isMobile ? 0.8 : 1,
              }}
            />
          )}
          <CardMedia
            component="img"
            height={isMobile ? 120 : 140}
            image={
              lot.image_url ||
              `https://source.unsplash.com/random/400x200/?parking,${lot.id}`
            }
            alt={lot.name}
          />
          <CardContent
            sx={{
              flexGrow: 1,
              p: isMobile ? 1.5 : 2,
              pb: isMobile ? 1 : 1.5,
            }}
          >
            <Typography
              variant={isMobile ? "subtitle1" : "h5"}
              component="div"
              gutterBottom
              sx={{
                fontSize: isMobile ? "1rem" : undefined,
                fontWeight: isMobile ? 500 : 400,
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {lot.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
              sx={{
                fontSize: isMobile ? "0.75rem" : undefined,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mb: 1,
              }}
            >
              {lot.address}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mt: isMobile ? 0.5 : 1,
                mb: 0.5,
              }}
            >
              <Rating
                value={lot.rating || 4.2}
                precision={0.1}
                size="small"
                readOnly
                sx={{
                  fontSize: isMobile ? "0.8rem" : "1rem",
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  ml: 1,
                  fontSize: isMobile ? "0.65rem" : "0.75rem",
                }}
              >
                ({lot.review_count || Math.floor(Math.random() * 50) + 10})
              </Typography>
            </Box>

            <Divider sx={{ my: isMobile ? 1 : 1.5 }} />

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 0.5,
                mt: isMobile ? 1 : 2,
                justifyContent: isMobile ? "space-between" : "flex-start",
              }}
            >
              <Chip
                icon={
                  <LocalParkingIcon
                    sx={{ fontSize: isMobile ? "0.9rem" : "1rem" }}
                  />
                }
                label={`${
                  lot.available_spots || Math.floor(Math.random() * 20)
                }个空位`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  height: isMobile ? 20 : 24,
                  fontSize: isMobile ? "0.65rem" : "0.75rem",
                  "& .MuiChip-icon": {
                    fontSize: isMobile ? "0.9rem" : "1rem",
                  },
                }}
              />
              <Chip
                icon={
                  <AccessTimeIcon
                    sx={{ fontSize: isMobile ? "0.9rem" : "1rem" }}
                  />
                }
                label={`¥${
                  lot.hourly_rate || Math.floor(Math.random() * 10) + 5
                }/时`}
                size="small"
                variant="outlined"
                sx={{
                  height: isMobile ? 20 : 24,
                  fontSize: isMobile ? "0.65rem" : "0.75rem",
                  "& .MuiChip-icon": {
                    fontSize: isMobile ? "0.9rem" : "1rem",
                  },
                }}
              />
              <Chip
                icon={
                  <DirectionsCarIcon
                    sx={{ fontSize: isMobile ? "0.9rem" : "1rem" }}
                  />
                }
                label={
                  lot.distance
                    ? `${lot.distance}公里`
                    : `${(Math.random() * 2 + 0.1).toFixed(1)}公里`
                }
                size="small"
                variant="outlined"
                sx={{
                  height: isMobile ? 20 : 24,
                  fontSize: isMobile ? "0.65rem" : "0.75rem",
                  "& .MuiChip-icon": {
                    fontSize: isMobile ? "0.9rem" : "1rem",
                  },
                }}
              />
            </Box>
          </CardContent>
          <CardActions
            sx={{
              px: isMobile ? 1.5 : 2,
              pb: isMobile ? 1.5 : 2,
              pt: 0,
              mt: isMobile ? 0 : "auto",
            }}
          >
            {isMobile ? (
              // 移动端按钮布局
              <Grid container spacing={1}>
                {lot.isAIPick && (
                  <Grid item xs={6}>
                    <MobileActionButton
                      onClick={() => handleOpenSimulator(lot)}
                    >
                      3D模拟器
                    </MobileActionButton>
                  </Grid>
                )}
                <Grid item xs={lot.isAIPick ? 6 : 12}>
                  <MobileActionButton
                    onClick={() => handleSelectParkingLot(lot)}
                    isPrimary
                  >
                    选择此停车场
                  </MobileActionButton>
                </Grid>
              </Grid>
            ) : (
              // 桌面端按钮布局
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
            )}
          </CardActions>
        </Card>
      </Grid>
    ));
  };

  return (
    <Box sx={{ py: isMobile ? 2 : 4 }}>
      <Typography
        variant={isMobile ? "h5" : "h4"}
        component="h1"
        gutterBottom
        sx={{
          mb: isMobile ? 2 : 3,
          fontSize: isMobile ? "1.5rem" : undefined,
          fontWeight: isMobile ? 500 : 400,
        }}
      >
        {isMobile ? "附近停车场" : "选择附近停车场"}
      </Typography>

      <Grid container spacing={isMobile ? 1.5 : 3}>
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
