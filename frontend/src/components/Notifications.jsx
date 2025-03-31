import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Badge, Menu, MenuItem, ListItemText } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import useSocket from '../hooks/useSocket';

/**
 * Notification component that displays real‑time notifications.
 * @param {Object} props
 * @param {string} props.userId - The user ID for joining the socket room.
 */
const Notifications = ({ userId }) => {
  // Use the custom hook to get notifications
  const { notifications } = useSocket(userId);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={notifications.length} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ style: { maxHeight: 300, width: '30ch' } }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <MenuItem key={index} onClick={handleClose}>
              <ListItemText primary={notification.message} />
            </MenuItem>
          ))
        ) : (
          <MenuItem onClick={handleClose}>
            <ListItemText primary="No new notifications" />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

Notifications.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default Notifications;
