import React from 'react';
import PropTypes from 'prop-types';
import { hasContent } from './utils';

const ListCell = (props) => {
  const {data, render} = props;
  return (
    <ul>
    {
      data.filter((dat) => (
        hasContent(dat)
      )).map((dat, index) => (
        <li key={index}>{render({elementData: dat})}</li>
      ))
    }
    </ul>
  );
};

ListCell.propTypes = {
  data: PropTypes.arrayOf(PropTypes.any),
  render: PropTypes.func
};

export default ListCell;
