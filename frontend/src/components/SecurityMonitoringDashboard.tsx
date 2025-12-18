import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Grid,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Security,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Refresh,
  Clear,
  Info
} from '@mui/icons-material'
import { useSecurityContext } from '../context/SecurityContext'
import { useSecurityMonitoring } from '../hooks/useSecurityMonitoring'
import { ThreatLevel } from '../services/ValidationService'

/**
 * Security monitoring dashboard component
 */
const SecurityMonitoringDashboard: React.FC = () => {
  const { state } = useSecurityContext()
  const {
    isMonitoring,
    threatLevel,
    recentEvents,
    threatCount,
    blockedRequests,
    getThreatSummary,
    getSecurityScore,
    clearEvents,
    startMonitoring,
    stopMonitoring
  } = useSecurityMonitoring()

  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const securityScore = getSecurityScore()
  const threatSummary = getThreatSummary()

  /**
   * Get color for threat level
   */
  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.CRITICAL: return 'error'
      case ThreatLevel.HIGH: return 'warning'
      case ThreatLevel.MEDIUM: return 'info'
      case ThreatLevel.LOW: return 'success'
      default: return 'default'
    }
  }

  /**
   * Get icon for threat level
   */
  const getThreatIcon = (level: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.CRITICAL: return <ErrorIcon />
      case ThreatLevel.HIGH: return <Warning />
      case ThreatLevel.MEDIUM: return <Security />
      case ThreatLevel.LOW: return <CheckCircle />
      default: return <Info />
    }
  }

  /**
   * Get security score color
   */
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            Security Monitoring
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              color={isMonitoring ? 'error' : 'primary'}
              variant="outlined"
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>
            <IconButton size="small" onClick={clearEvents}>
              <Clear />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Security Score */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Security Score: {securityScore}/100
          </Typography>
          <LinearProgress
            variant="determinate"
            value={securityScore}
            color={getScoreColor(securityScore)}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Status Overview */}
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color={getThreatColor(threatLevel)}>
                {threatCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Threats
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="error">
                {blockedRequests}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Blocked Requests
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="info">
                {recentEvents.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Recent Events
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box textAlign="center">
              <Chip
                icon={getThreatIcon(threatLevel)}
                label={threatLevel}
                color={getThreatColor(threatLevel)}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Threat Level
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Current Status */}
        {threatLevel === ThreatLevel.CRITICAL && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Critical security threats detected! Immediate attention required.
          </Alert>
        )}
        
        {threatLevel === ThreatLevel.HIGH && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            High-level security threats detected. Please review recent activity.
          </Alert>
        )}

        {!isMonitoring && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Security monitoring is currently disabled.
          </Alert>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box mt={2}>
            {/* Threat Summary */}
            <Typography variant="subtitle2" gutterBottom>
              Threat Summary by Level:
            </Typography>
            <Grid container spacing={1} mb={2}>
              {Object.entries(threatSummary.byLevel).map(([level, count]) => (
                <Grid key={level}>
                  <Chip
                    label={`${level}: ${count}`}
                    color={getThreatColor(level as ThreatLevel)}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              ))}
            </Grid>

            {/* Recent Events */}
            <Typography variant="subtitle2" gutterBottom>
              Recent Security Events:
            </Typography>
            {recentEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No recent security events
              </Typography>
            ) : (
              <List dense>
                {recentEvents.slice(0, 5).map((event) => (
                  <ListItem
                    key={event.id}
                    component="div"
                    onClick={() => {
                      setSelectedEvent(event)
                      setDetailsOpen(true)
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <ListItemIcon>
                      {getThreatIcon(event.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={event.description}
                      secondary={`${event.type} - ${formatTimestamp(event.timestamp)}`}
                    />
                    <Chip
                      label={event.severity}
                      color={getThreatColor(event.severity)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Collapse>

        {/* Event Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Security Event Details</DialogTitle>
          <DialogContent>
            {selectedEvent && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedEvent.description}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Type: {selectedEvent.type}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Severity: {selectedEvent.severity}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Source: {selectedEvent.source || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Timestamp: {formatTimestamp(selectedEvent.timestamp)}
                    </Typography>
                  </Grid>
                  {selectedEvent.blocked && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info">
                        This event was automatically blocked
                      </Alert>
                    </Grid>
                  )}
                </Grid>
                {selectedEvent.details && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Details:
                    </Typography>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: '8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default SecurityMonitoringDashboard
