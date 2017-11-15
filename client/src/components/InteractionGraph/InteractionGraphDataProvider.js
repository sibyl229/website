import React, { Component } from 'react';

export default class InteractionGraphDataProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    const geneId = 'WBGene00015146';
    const fieldUrl = `/rest/field/gene/${geneId}/interaction_details?content-type=application/json`;
    fetch(fieldUrl).then(
      (response) => response.json()
    ).then(
      (json) => {
        this.setState({
          data: json.interaction_details
        });
      }
    ).catch(() => {
      this.setState({
        error: `failed to load data from ${fieldUrl}`
      })
    });
  }

  render() {
    console.log(this.state.data);
    return (
      <div>
        {
          this.state.error || (
            this.state.data ? this.props.children({
              interactorMap: this.state.data.data.nodes,
              interactions: this.state.data.data.edges
              /* interactions: [
               *   {type: "gi-module-one:a-phenotypic"},
               *   {type: "gi-module-one:cis-phenotypic"},
               *   {type: "gi-module-two:semi-suppressing"},
               *   {type: "gi-module-three:neutral"}d
               * ]*/
            }) : <span>Loading...</span>
          )
        }
      </div>
    );
  }
}
