import React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';

const CustomButton = ({ children, variant, color, ...props }) => {
  return (
    <Button variant={variant} color={color} {...props}>
      {children}
    </Button>
  );
};

// Prop Types for type safety
CustomButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['primary', 'secondary']),
};

CustomButton.defaultProps = {
  variant: 'contained',
  color: 'primary',
};

export default CustomButton;
