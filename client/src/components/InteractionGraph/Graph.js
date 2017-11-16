import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { Surface, Shape, Group, Text, Transform } from 'react-art';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { select, event } from 'd3-selection';
import { drag } from 'd3-drag';
import 'art/modes/svg';

class Circle extends Component {
  render() {
    const {r, ...otherProps} = this.props;
    return <Shape {...otherProps} d={`M ${-r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`} />;
  }
}

export default class Graph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      annotatedNodes: [],
      annotatedEdges: []
    };
  }
  componentDidMount = () => {
    this.simulation = forceSimulation()
      .force("link", forceLink().id(function(d) { return d.id; }).distance(100))
      .force("charge", forceManyBody().strength(-100))
      .force("center", forceCenter(this.props.width / 2, this.props.height / 2))
      .on("tick", this.redraw);

    const canvas = findDOMNode(this._canvas);

    const dragsubject = () => {
      return this.simulation.find(event.x, event.y, 15);
    }

    const dragstarted = () => {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    const dragged = () => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    const dragended = () => {
      if (!event.active) this.simulation.alphaTarget(0);
      /* event.subject.fx = null;
       * event.subject.fy = null;*/
    }

    select(canvas)
      .call(
        drag()
          .container(canvas)
          .subject(dragsubject)
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    this.setupSimulationData();
  }

  setupSimulationData = () => {
    this.copiedNodes = this.props.nodes.map((d) => ({...d}));
    this.copiedEdges = this.props.edges.map((d) => ({...d}));
    this.simulation
        .nodes(this.copiedNodes)

    this.simulation.force("link")
        .links(this.copiedEdges);
  }

  redraw = () => {
    this.setState({
      annotatedNodes: this.copiedNodes,
      annotatedEdges: this.copiedEdges
    })
  }


  render() {
    return (
      <div>
        <Surface
          ref={(c) => this._canvas = c }
          width={this.props.width}
          height={this.props.height}
          style={{cursor: 'pointer'}}>
          <Group>
            {
              (this.state.annotatedEdges || []).map((d) => (
                <Shape
                  key={d.id}
                  d={`M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`}
                  stroke={d.color}
                  strokeWidth={1}
                />
              ))
            }
            {
              (this.state.annotatedNodes || []).map((d) => (
                <Group key={d.id} transform={(new Transform().translate(d.x, d.y))}>
                  <Circle r={15} fill={d.color} />
                  <Group>
                    <Text alignment="middle" font="12px helvetica" fill={"black"} strokeWidth={3} stroke="white" opacity={0.5}>{d.label}</Text>
                    <Text alignment="middle" font="12px helvetica" fill={"black"}>{d.label}</Text>
                  </Group>
                </Group>
              ))
            }
          </Group>
        </Surface>
      </div>
    );
  }
}
