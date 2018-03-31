import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import SaveJSON from './SaveJSON';
import Print from './Print';
import 'react-table/react-table.css';
import './styles.css';

export default class Table extends Component {
  render() {
    const defaultTableProps = {
      className: "-striped",
      defaultPageSize: 10,
      defaultSorted: this.props.columns[0] ? [{id: this.props.columns[0].id || this.props.columns[0].accessor }] : undefined,
      ...this.props,
    };

    const printableTable = (
      <ReactTable
        {...defaultTableProps}
        columns={
          this.props.columns.map((c) => ({
            ...c,
          }))
        }
        getTdProps={(state, rowInfo, column, instance) => {
            return {
              ...(this.props.getTdProps ? this.props.getTdProps(state, rowInfo, column, instance) : {}),
              printable: true,
            };
        }}
        defaultPageSize={this.props.data.length}
      />
    );

    return (
      <div>
        <SaveJSON data={this.props.data}>JSON</SaveJSON>
        <Print node={printableTable}>Print</Print>
        {printableTable}
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
