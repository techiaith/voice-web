import { h, Component } from 'preact';

export default (props) => {
  return <a class="main-logo" href="/"
    onClick={(evt) =>  {
      evt.preventDefault();
      evt.stopPropagation();
      props.navigate('/');
    }}>
    <img src="/img/paldaruo.png" /><br />
    <span class="main-title">Paldaruo</span><br />
  </a>;
}
