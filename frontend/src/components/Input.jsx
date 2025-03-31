import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';

const CustomInput = ({ label, type = 'text', ...props }) => {
  return <TextField label={label} type={type} variant="outlined" fullWidth {...props} />;
};

// ✅ Add PropTypes validation
CustomInput.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
};

export default CustomInput;
