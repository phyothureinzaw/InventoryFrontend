import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Chip, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined'
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlineOutlined'
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import PointOfSaleOutlinedIcon from '@mui/icons-material/PointOfSaleOutlined'
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../auth/AuthProvider'

const drawerWidth = 248
const navigation = [
  { label: 'Dashboard', path: '/', Icon: DashboardOutlinedIcon },
  { label: 'Products', path: '/products', Icon: Inventory2OutlinedIcon },
  { label: 'Categories', path: '/categories', Icon: CategoryOutlinedIcon },
  { label: 'Suppliers', path: '/suppliers', Icon: LocalShippingOutlinedIcon },
  { label: 'Customers', path: '/customers', Icon: ContactsOutlinedIcon },
  { label: 'Sales Orders', path: '/sales-orders', Icon: PointOfSaleOutlinedIcon },
  { label: 'Purchase Orders', path: '/purchase-orders', Icon: AssignmentOutlinedIcon },
  { label: 'Customer Returns', path: '/customer-returns', Icon: AssignmentReturnOutlinedIcon },
  { label: 'Supplier Returns', path: '/supplier-returns', Icon: AssignmentReturnOutlinedIcon },
  { label: 'Stock In', path: '/stock-in', Icon: ArrowDownwardOutlinedIcon },
  { label: 'Stock Out', path: '/stock-out', Icon: ArrowUpwardOutlinedIcon },
  { label: 'Movement History', path: '/movement-history', Icon: HistoryOutlinedIcon },
  { label: 'Users', path: '/users', Icon: PeopleOutlineIcon, role: 'Admin' as const },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'))
  const drawer = <Box component="nav" sx={{ width: drawerWidth, p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 2.5, mb: 1 }}>
      <Inventory2OutlinedIcon color="primary" /><Typography sx={{ fontWeight: 800 }}>Stockroom</Typography>
    </Box>
    {user && <Box sx={{ px: 1.5, py: 1.5, mb: 1.5, borderRadius: 2, bgcolor: '#f3f6fb' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{user.displayName}</Typography><Typography variant="caption" color="text.secondary">{user.role}</Typography></Box>}
    <List sx={{ display: 'grid', gap: 0.5 }}>{navigation.filter((item) => !item.role || item.role === user?.role).map(({ label, path, Icon }) => (
      <ListItemButton key={path} component={NavLink} to={path} onClick={() => setMobileOpen(false)} sx={{ borderRadius: 2, '&.active': { bgcolor: '#e8f0ff', color: 'primary.main', fontWeight: 700 } }}>
        <ListItemIcon sx={{ minWidth: 38 }}><Icon fontSize="small" /></ListItemIcon><ListItemText primary={label} />
      </ListItemButton>
    ))}</List>
  </Box>
  return <Box sx={{ display: 'flex', minHeight: '100vh' }}>
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e6eaf0', bgcolor: 'rgba(255,255,255,.92)' }}>
      <Toolbar sx={{ ml: { md: `${drawerWidth}px` }, gap: 1 }}><IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' }, mr: 1 }}><MenuIcon /></IconButton><Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>Inventory workspace</Typography>{user && <><Chip avatar={<Avatar>{user.displayName.charAt(0).toUpperCase()}</Avatar>} label={`${user.displayName} · ${user.role}`} size="small" sx={{ display: { xs: 'none', sm: 'flex' } }} /><Tooltip title="Sign out"><IconButton onClick={logout} aria-label="Sign out"><LogoutIcon /></IconButton></Tooltip></>}</Toolbar>
    </AppBar>
    {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>{drawer}</Drawer> : <Drawer variant="permanent" sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', border: 0 } }}>{drawer}</Drawer>}
    <Box component="main" sx={{ flexGrow: 1, ml: { md: `${drawerWidth}px` }, pt: 11, px: { xs: 2, md: 5 }, pb: 5 }}><Outlet /></Box>
  </Box>
}
