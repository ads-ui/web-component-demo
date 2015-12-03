import React from 'react';
import ReactDOM from 'react-dom';
import ns from './nsName';

var Button = React.createClass({
  render() {
    return <button type="button" class={ns} />
  }
});

export default Button;
