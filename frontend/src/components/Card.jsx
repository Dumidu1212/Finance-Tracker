import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';

const CustomCard = ({ title, content, actionLabel, onAction }) => {
  return (
    <Card sx={{ maxWidth: 345, m: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {content}
        </Typography>
      </CardContent>
      {actionLabel && (
        <CardActions>
          <Button size="small" onClick={onAction}>
            {actionLabel}
          </Button>
        </CardActions>
      )}
    </Card>
  );
};

// Prop Types
CustomCard.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

CustomCard.defaultProps = {
  actionLabel: null,
  onAction: null,
};

export default CustomCard;
