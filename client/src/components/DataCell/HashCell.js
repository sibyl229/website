import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { hasContent } from './utils';
//import SimpleCell from './SimpleCell';

const HashCell = (props) => {
  const {data, render, classes} = props;
  return (
    <div className={classes.root}>
    {
      Object.keys(data).filter((key) => (
        hasContent(data[key])
      )).map((key) => (
        <div key={key} className={classes.pair}>
          <div className={classes.key}>{key.replace(/_+/g, ' ')}: </div>
          <div className={classes.value}>{render({elementValue: data[key]})}</div>
        </div>
      ))
    }
    </div>
  );
};

HashCell.propTypes = {
  data: PropTypes.object,
  render: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

const styles = (theme) => {
  return {
    root: {
      margin: theme.spacing.unit / 4,
    },
    pair: {
      display: 'flex',
      flexWrap: 'wrap',
      padding: 0,
    },
    key: {
      fontWeight: 700,
      margin: `0 ${theme.spacing.unit / 4}px`,
      minWidth: 100,
    },
    value: {
      margin: -theme.spacing.unit / 4,
    },
  }
};

export default withStyles(styles, { withTheme: true })(HashCell);
