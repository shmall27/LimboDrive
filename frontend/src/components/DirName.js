import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import useKeypress from '../hooks/useKeyPress';
import useOnClickOutside from '../hooks/useOnClickOutside';
function DirName(props) {
  const [isInputActive, setIsInputActive] = useState(false);
  const [inputValue, setInputValue] = useState(props.text);
  const wrapperRef = useRef(null);
  const textRef = useRef(null);
  const inputRef = useRef(null);
  const enter = useKeypress('Enter');
  const esc = useKeypress('Escape');
  // check to see if the user clicked outside of this component
  useOnClickOutside(wrapperRef, () => {
    if (isInputActive) {
      props.onSetText(inputValue);
      setIsInputActive(false);
      if (props.text !== inputValue) {
        //Update database here
        axios
          .post('https://limbo-drive.herokuapp.com/update-name', {
            jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
            dirName: inputValue,
            dirID: props.dirID,
          })
          .then(
            (response) => {
              console.log(response);
            },
            (error) => {
              console.log(error);
            }
          );
      }
    }
  });
  // focus the cursor in the input field on edit start
  useEffect(() => {
    if (isInputActive) {
      inputRef.current.focus();
    }
  }, [isInputActive]);
  useEffect(() => {
    if (isInputActive) {
      // if Enter is pressed, save the text and case the editor
      if (enter) {
        props.onSetText(inputValue);
        setIsInputActive(false);
        if (props.text !== inputValue) {
          //Update database here
          axios
            .post('https://limbo-drive.herokuapp.com/update-name', {
              jwt: JSON.parse(window.localStorage.getItem('jwt')).data,
              dirName: inputValue,
              dirID: props.dirID,
            })
            .then(
              (response) => {
                console.log(response);
              },
              (error) => {
                console.log(error);
              }
            );
        }
      }
      // if Escape is pressed, revert the text and close the editor
      if (esc) {
        setInputValue(props.text);
        setIsInputActive(false);
      }
    }
  }, [enter, esc]); // watch the Enter and Escape key presses
  return (
    <span className='inline-text' ref={wrapperRef}>
      <span
        ref={textRef}
        onClick={() => setIsInputActive(true)}
        className={`inline-text_copy inline-text_copy--${
          !isInputActive ? 'active' : 'hidden'
        }`}
      >
        {props.text}
      </span>
      <input
        ref={inputRef}
        // set the width to the input length multiplied by the x height
        // it's not quite right but gets it close
        style={{ width: Math.ceil(inputValue.length * 0.9) + 'ex' }}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        className={`inline-text_input inline-text_input--${
          isInputActive ? 'active' : 'hidden'
        }`}
      />
    </span>
  );
}
export default DirName;
