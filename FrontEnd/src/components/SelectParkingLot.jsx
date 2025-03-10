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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VideogameAssetIcon from "@mui/icons-material/VideogameAsset";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ParkingSimulator from "./ParkingSimulator"; // 导入我们创建的模拟器组件

function SelectParkingLot({ parkingLots, onSelectParkingLot, isLoading }) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [gameResults, setGameResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // 处理打开模拟器
  const handleOpenSimulator = (lot) => {
    setSelectedLotId(lot.id);
    setSelectedLot(lot);
    setShowSimulator(true);
  };

  // 处理关闭模拟器
  const handleCloseSimulator = (results) => {
    setShowSimulator(false);

    // 如果有游戏结果，显示结果对话框
    if (results && !results.closed) {
      setGameResults(results);
      setShowResults(true);
    }
  };

  // 处理选择停车场
  const handleSelectParkingLot = (lot) => {
    // 调用父组件的回调
    onSelectParkingLot(lot);
  };

  // 处理游戏结果对话框关闭
  const handleCloseResults = () => {
    setShowResults(false);
    setGameResults(null);
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
          }}
        >
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
            <Typography gutterBottom variant="h5" component="div">
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
          <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<VideogameAssetIcon />}
              onClick={() => handleOpenSimulator(lot)}
            >
              3D Simulator
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSelectParkingLot(lot)}
            >
              Navigate
            </Button>
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

      {/* 停车模拟游戏 */}
      <ParkingSimulator
        open={showSimulator}
        onClose={handleCloseSimulator}
        parkingLotId={selectedLotId}
        difficulty="medium"
      />

      {/* 游戏结果对话框 */}
      <Dialog open={showResults} onClose={handleCloseResults}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EmojiEventsIcon color="warning" />
          Parking Simulation Results
        </DialogTitle>
        <DialogContent>
          {gameResults && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Great job!
              </Typography>
              <Typography variant="body1" paragraph>
                You successfully parked in spot {gameResults.spot?.id}.
              </Typography>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", my: 2 }}
              >
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="h6">
                    {Math.floor(gameResults.timeElapsed / 60)}:
                    {(gameResults.timeElapsed % 60).toString().padStart(2, "0")}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Score
                  </Typography>
                  <Typography variant="h6">{gameResults.score}</Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Would you like to navigate to this parking lot?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResults}>Close</Button>
          {selectedLot && (
            <Button
              variant="contained"
              onClick={() => {
                handleCloseResults();
                handleSelectParkingLot(selectedLot);
              }}
            >
              Navigate to This Parking
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SelectParkingLot;
