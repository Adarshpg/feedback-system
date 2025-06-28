import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/Medini white  logo.png';

// Styled components using the new MUI v5 approach
const StyledAppBar = styled(AppBar)({
  boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 4px 5px 0 rgba(0, 0, 0, 0.08), 0 1px 10px 0 rgba(0, 0, 0, 0.06)',
  backgroundColor: '#2c4a57',
  minHeight: '80px', // Increased navbar height
  display: 'flex',
  justifyContent: 'center',
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '80px !important', // Match the AppBar height
  padding: '0 24px !important', // Add horizontal padding
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between', // This will push the navigation to the right
});

const StyledMenuButton = styled(IconButton)(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const NavButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2), // Add space between buttons
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Feedback', path: '/feedback/1' },
  ];

  const authItems = [
    { label: 'Login', path: '/login' },
    { label: 'Register', path: '/register' },
  ];

  return (
    <StyledAppBar position="static">
      <Container maxWidth="xl" sx={{ padding: 0 }}>
        <StyledToolbar disableGutters>
          <Box 
            component={RouterLink} 
            to={isAuthenticated ? "/dashboard" : "/"} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              height: '100%',
              marginRight: 'auto' // Push everything else to the right
            }}
          >
            <img 
              src={logo} 
              alt="Logo" 
              style={{ 
                height: '50px',
                objectFit: 'contain',
                padding: '5px 0'
              }} 
            />
          </Box>

          {isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <StyledMenuButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </StyledMenuButton>
              <Menu
                id="mobile-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {isAuthenticated ? (
                  [
                    ...navItems.map((item) => (
                      <MenuItem 
                        key={item.path}
                        component={RouterLink}
                        to={item.path}
                        onClick={handleMenuClose}
                      >
                        {item.label}
                      </MenuItem>
                    )),
                    <MenuItem 
                      key="logout"
                      onClick={() => {
                        handleLogout();
                        handleMenuClose();
                      }}
                    >
                      Logout
                    </MenuItem>
                  ]
                ) : (
                  authItems.map((item) => (
                    <MenuItem 
                      key={item.path}
                      component={RouterLink}
                      to={item.path}
                      onClick={handleMenuClose}
                    >
                      {item.label}
                    </MenuItem>
                  ))
                )}
              </Menu>
            </Box>
          ) : (
            <NavButtons>
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      component={RouterLink}
                      to={item.path}
                      sx={{ 
                        mx: 1,
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    sx={{ 
                      mx: 1,
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                authItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    component={RouterLink}
                    to={item.path}
                    sx={{ 
                      mx: 1,
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))
              )}
            </NavButtons>
          )}
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Navbar;
