import React, { Component } from 'react';
import ReactTable, { ReactTableDefaults } from 'react-table';
import 'react-table/react-table.css';

export default class Table extends Component {
  render() {
    return (
      <ReactTable
        className="-striped -highlight"
        defaultPageSize={10}
        {...this.props}
      />
    );
  }
};

export const tableDefaults = ReactTableDefaults;