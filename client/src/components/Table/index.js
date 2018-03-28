import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import SaveJSON from './SaveJSON';
import 'react-table/react-table.css';
import './styles.css';

export default class Table extends Component {
  render() {
    return (
      <div>
        <SaveJSON data={this.props.data} />
        <ReactTable
          className="-striped"
          defaultPageSize={10}
          defaultSorted={
            this.props.columns[0] ? [{id: this.props.columns[0].id || this.props.columns[0].accessor }] : undefined
          }
          {...this.props}
        />
      </div>
    );
  }
};

Table.propTypes = {
  data: PropTypes.any,
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
