import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import SaveJSON from './SaveJSON';
import SavePDF from './SavePDF';
import 'react-table/react-table.css';
import './styles.css';

export default class Table extends Component {
  render() {
    const table = (
      <ReactTable
        className="-striped"
        defaultPageSize={10}
        defaultSorted={
          this.props.columns[0] ? [{id: this.props.columns[0].id || this.props.columns[0].accessor }] : undefined
        }
        {...this.props}
      />
    );
    return (
      <div>
        <SaveJSON data={this.props.data}>JSON</SaveJSON>
        <SavePDF node={table}>PDF</SavePDF>
        {table}
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
