import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import 'react-table/react-table.css';

export default class Table extends Component {
  render() {
    return (
      <ReactTable
        className="-striped -highlight"
        defaultPageSize={10}
        defaultSorted={
          this.props.columns[0] ? [{id: this.props.columns[0].id || this.props.columns[0].accessor }] : undefined
        }
        {...this.props}
      />
    );
  }
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
      PropTypes.shape({
        accessor: PropTypes.string.isRequired,
      }),
    ])
  ).isRequired,
};

export const tableDefaults = ReactTableDefaults;