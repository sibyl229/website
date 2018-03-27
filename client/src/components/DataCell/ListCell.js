import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { hasContent } from './utils';


const ListCell = (props) => {
  const {data, render, classes} = props;
  return (
    <ul className={classes.ul}>
    {
      data.filter((dat) => (
        hasContent(dat)
      )).map((dat, index) => (
        <li key={index} className={classes.li}>
          {render({elementData: dat})}
        </li>
      ))
    }
    </ul>
  );
};

ListCell.propTypes = {
  data: PropTypes.arrayOf(PropTypes.any),
  render: PropTypes.func,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,

};

const style = (theme) => {
  return {
    ul: {
      margin: 0,
      padding: `0 ${theme.spacing.unit}px`,
      listStyleType: 'none',
    },
    li: {

    },
  };
};

export default withStyles(style, {withTheme: true})(ListCell);
