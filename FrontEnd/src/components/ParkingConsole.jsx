import DirectionsIcon from "@mui/icons-material/Directions";
import InfoIcon from "@mui/icons-material/Info";
import NavigationIcon from "@mui/icons-material/Navigation";

const ParkingConsole = ({
  recommendedSpot,
  aiReasoning,
  navigationInstructions,
  currentPosition,
  isNearRecommended,
  onRerouteRequest,
}) => {
  return (
    <Card
      sx={{
        width: 300,
        maxWidth: "100%",
        opacity: 0.9,
        bgcolor: "#1e1e1e",
        color: "white",
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          停车位导航助手
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <MyLocationIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
          <Typography variant="body2">
            当前位置: [{Math.round(currentPosition?.[0] / 3 || 0)},{" "}
            {Math.round(currentPosition?.[2] / 3 || 0)}]
          </Typography>
        </Box>

        {recommendedSpot && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <NavigationIcon fontSize="small" sx={{ mr: 1 }} color="secondary" />
            <Typography variant="body2">
              目标车位: {recommendedSpot.id} ({recommendedSpot.row},{" "}
              {recommendedSpot.col})
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1, bgcolor: "rgba(255,255,255,0.1)" }} />

        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <DirectionsIcon fontSize="small" sx={{ mr: 1 }} />
          导航指引:
        </Typography>

        <List dense sx={{ bgcolor: "#333333", borderRadius: 1, mb: 2 }}>
          {navigationInstructions &&
            navigationInstructions.map((instruction, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36, color: "white" }}>
                  {index + 1}.
                </ListItemIcon>
                <ListItemText primary={instruction} sx={{ color: "#bbbbbb" }} />
              </ListItem>
            ))}
        </List>

        <Button
          variant="contained"
          color="primary"
          size="small"
          fullWidth
          onClick={onRerouteRequest}
          sx={{ mb: 2 }}
        >
          重新路线规划
        </Button>

        {isNearRecommended && (
          <Box
            sx={{
              bgcolor: "success.main",
              color: "white",
              p: 1,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2">
              您已接近目标车位，请小心停车
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ParkingConsole;
