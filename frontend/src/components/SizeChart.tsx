import React from 'react'
import {   
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box
 } from '@mui/material'
import { strings } from '../lang/dresses'

interface SizeChartProps {
  open: boolean
  onClose: () => void
}

const SizeChart: React.FC<SizeChartProps> = ({ open, onClose }) => {
  const sizeData = [
    { size: 'XS', bust: '32-34', waist: '24-26', hips: '34-36' },
    { size: 'S', bust: '34-36', waist: '26-28', hips: '36-38' },
    { size: 'M', bust: '36-38', waist: '28-30', hips: '38-40' },
    { size: 'L', bust: '38-40', waist: '30-32', hips: '40-42' },
    { size: 'XL', bust: '40-42', waist: '32-34', hips: '42-44' },
    { size: 'XXL', bust: '42-44', waist: '34-36', hips: '44-46' },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          {strings.SIZE_CHART || 'Size Chart'}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {strings.SIZE_CHART_DESCRIPTION || 'All measurements are in inches. For the best fit, we recommend professional measurements.'}
          </Typography>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{strings.SIZE || 'Size'}</strong></TableCell>
                <TableCell><strong>{strings.BUST || 'Bust'}</strong></TableCell>
                <TableCell><strong>{strings.WAIST || 'Waist'}</strong></TableCell>
                <TableCell><strong>{strings.HIPS || 'Hips'}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sizeData.map((row) => (
                <TableRow key={row.size}>
                  <TableCell component="th" scope="row">
                    <strong>{row.size}</strong>
                  </TableCell>
                  <TableCell>{row.bust}&quot;</TableCell>
                  <TableCell>{row.waist}&quot;</TableCell>
                  <TableCell>{row.hips}&quot;</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>{strings.FITTING_NOTE || 'Note'}:</strong> {strings.FITTING_RECOMMENDATION || 'If you are between sizes, we recommend choosing the larger size. Professional alterations are available for an additional fee.'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {strings.CLOSE || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SizeChart
