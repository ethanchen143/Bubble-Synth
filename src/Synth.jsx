import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';
import './synth.css'

//todo: add record button
const Synth = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  const [bpm, setBpm] = useState(160);
  const [noteLow, setNoteLow] = useState(false);
  const [noteMid, setNoteMid] = useState(false);
  const [noteHigh, setNoteHigh] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const synthPool = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [inst,setInst] = useState('triangle')

  const [attack, setAttack] = useState(0.01); //50ms initial attack
  const [decay, setDecay] = useState(2);
  const [detune, setDetune] = useState(0);
  const [slide, setSlide] = useState(0);
  const [dropout,setDropout] = useState(0);

  const [filter,setFilter] = useState(false)
  const [delay,setDelay] = useState(false)
  const [vibrato,setVibrato] = useState(false)
  const [distortion,setDistortion] = useState(false)
  const [effectBubbles,setEffectBubbles] = useState([])
  const effectPool = useRef([])

  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modes = {
    minor_pentatonic: [0, 3, 5, 7, 10],
    major_pentatonic: [0, 2, 4, 7, 9],
    major_scale: [0, 2, 4, 5, 7, 9, 11],
    minor_scale: [0, 2, 3, 5, 7, 8, 10],
    major_triad: [0, 4, 7],            
    minor_triad: [0, 3, 7],            
    major_sixth_chord: [0, 4, 7, 9],         
    minor_sixth_chord: [0, 3, 7, 9],       
    major_seventh_chord: [0, 4, 7, 11],
    minor_seventh_chord: [0, 3, 7, 10],
    dominant_seventh_chord: [0, 4, 7, 10],
    major_ninth_chord: [0, 4, 7, 11, 14],
    minor_ninth_chord: [0, 3, 7, 10, 14],
    dominant_ninth_chord: [0, 4, 7, 10, 14], 
    melodic_minor_scale: [0, 2, 3, 5, 7, 9, 11],
    wholetone_scale: [0, 2, 4, 6, 8, 10],
  };

  const [selectedKey, setSelectedKey] = useState(keys[Math.floor(Math.random() * keys.length)]);
  const modeKeys = Object.keys(modes);
  const [selectedMode, setSelectedMode] = useState(modeKeys[Math.floor(Math.random() * modeKeys.length)]);

  const insts = ['triangle','sine','sawtooth','square','piano','rhodes','vocal'];

  const generateScale = (key, mode, register) => {
    const keyIndex = keys.indexOf(key);
    let reg = register === 'low' ? 2 : register === 'mid' ? 3 : 4;
    const scale = modes[mode].map((interval) => {
      if (keyIndex + interval >= keys.length) {
        return keys[(keyIndex + interval) % keys.length] + String(reg+1);
      }
      return keys[(keyIndex + interval) % keys.length] + String(reg);
    });
    //adding root note in the next octave
    scale.push(key+String(reg+1))
    return scale;
  };

  const lowScale = generateScale(selectedKey, selectedMode, 'low');
  const midScale = generateScale(selectedKey, selectedMode, 'mid');
  const highScale = generateScale(selectedKey, selectedMode, 'high');
  
  // Initialize synth pool
  useEffect(() => {
    if (synthPool.current.length === 0) {
      for (let i = 0; i < 16; i++) {
        const synth = new Tone.Synth();
        synth.volume.value = -24;
        synthPool.current.push(synth);
      }
    } else {
      synthPool.current.forEach((synth,index) => {
        synth.set({
          envelope: {
            attack: attack,
            decay: (Math.pow(2,decay)-1)*10,
            sustain: 0,
            release: (Math.pow(2,decay)-1)*10,
          },
          detune: (Math.random() - 1) * detune,
          portamento: slide,
        });
        // if change is on synth (triangle,sine,etc)
        if ((inst.startsWith('tri') || inst.startsWith('s')) && index>=bubbles.length){
          synth.set({
            oscillator:{
              type: inst
            },
          })
          if (inst.startsWith('saw') || inst.startsWith('square')){
            synth.volume.value = -36 //bring down volume of saw and square
          } else {
            synth.volume.value = -24
          }
        }
      })
    }
  }, [inst, attack, decay, detune, slide]);


  const pianoSampler = useRef(null)
  const rhodeSampler = useRef(null)
  const vocalSampler = useRef(null)

  // Handle Sampler
  const loadSampler = async () => {
    // Load all samplers on load
    setIsLoading(true);
    pianoSampler.current = new Tone.Sampler({
      urls: {
        E2: `piano_E2.mp3`,
        A2: `piano_A2.mp3`,
        E3: `piano_E3.mp3`,
        A3: `piano_A3.mp3`,
        E4: `piano_E4.mp3`,
        A4: `piano_A4.mp3`,
        E5: `piano_E5.mp3`,
        A5: `piano_A5.mp3`,
      },
      baseUrl: "./assets/sample/",
      onload: () => {
        console.log("Piano sampler loaded.");
        setIsLoading(false);
      },
      onerror: (err) => {
        setIsLoading(false);
        console.error("Piano sampler loading error:", err);
      }
    });
    pianoSampler.current.volume.value = -6;
  
    rhodeSampler.current = new Tone.Sampler({
      urls: {
        E2: `rhode_E2.mp3`,
        A2: `rhode_A2.mp3`,
        E3: `rhode_E3.mp3`,
        A3: `rhode_A3.mp3`,
        E4: `rhode_E4.mp3`,
        A4: `rhode_A4.mp3`,
        E5: `rhode_E5.mp3`,
        A5: `rhode_A5.mp3`,
      },
      baseUrl: "./assets/sample/",
      onload: () => {
        console.log("Rhodes sampler loaded.");
        setIsLoading(false);
      },
      onerror: (err) => {
        setIsLoading(false);
        console.error("Rhodes sampler loading error:", err);
      }
    });
    rhodeSampler.current.volume.value = -18;

    vocalSampler.current = new Tone.Sampler({
      urls: {
        A2: `vocal_A2.mp3`,
        E3: `vocal_E3.mp3`,
        A3: `vocal_A3.mp3`,
        E4: `vocal_E4.mp3`,
        A4: `vocal_A4.mp3`,
      },
      baseUrl: "./assets/sample/",
      onload: () => {
        console.log("Vocal sampler loaded.");
        setIsLoading(false);
      },
      onerror: (err) => {
        setIsLoading(false);
        console.error("Vocal sampler loading error:", err);
      }
    });
    vocalSampler.current.volume.value = -32;
  };

  useEffect(() => {
    // reload sample when attack changes
    if (pianoSampler.current == null){
      loadSampler();
    } else {
      loadSampler()
      pianoSampler.current.set({
        attack: attack,
        release:(Math.pow(2,decay)-1)*20,
      })
      rhodeSampler.current.set({
        attack: attack,
        release:(Math.pow(2,decay)-1)*20,
      })
    }
  }, [attack,decay]);


  // Initilize effect pool (onload)
  useEffect(() => {
    if (effectPool.current.length === 0) {
      effectPool.current.push(new Tone.Filter(20000, 'lowpass', -24));
      effectPool.current.push(new Tone.PingPongDelay({time:'4n',maxDelay:10,wet:0.5}))
      effectPool.current.push(new Tone.Vibrato(9,0.75))
      effectPool.current.push(new Tone.Distortion(0.8))
    }
  }, []);

  //rerender pools when efx changed
  useEffect(() => {
    if (inst.startsWith('tri') || inst.startsWith('s')) {
      synthPool.current = []
      for (let i = 0; i < 16; i++) {
        const synth = new Tone.Synth({
          envelope: {
            attack: attack,
            decay: (Math.pow(2,decay)-1)*20,
            sustain: 0,
            release: (Math.pow(2,decay)-1)*20,
          },
          oscillator: {
            type: inst
          },
          detune: (Math.random() - 1) * detune,
          portamento: slide,
        });
        synth.volume.value = -24;
        synthPool.current.push(synth);
      }
    } else {
      loadSampler();
    }
    effectPool.current = []
    effectPool.current.push(new Tone.Filter(20000, 'lowpass', -24));
    effectPool.current.push(new Tone.PingPongDelay({time:'4n',maxDelay:3,wet:0.25}))
    effectPool.current.push(new Tone.Vibrato(9,0.75))
    effectPool.current.push(new Tone.Distortion(0.8))
  }, [effectBubbles])


  // Handle audio
  useEffect(() => {
    if (bubbles.length === 0 || isLoading) return;
    const canvas = canvasRef.current;
    const loop = new Tone.Loop((time) => {
      bubbles.forEach((bubble, index) => {
        if (Math.random() < dropout){
          return
        }
        let synth = synthPool.current[index % synthPool.current.length]
        if (bubble.inst == 'piano'){
          synth = pianoSampler.current
        }
        if (bubble.inst == 'rhodes'){
          synth = rhodeSampler.current
        }
        if (bubble.inst == 'vocal'){
          synth = vocalSampler.current
        }
        let efx = []
        effectBubbles.forEach((effect)=>{
          const ratioX = effect.x / canvas.width
          const ratioY = 1 - effect.y / canvas.height
          if (effect.property == 'filter'){
            const freq = 400 + Math.pow(2,(ratioX * 10)) * 20
            let filter = effectPool.current[0]
            filter.set({frequency:freq})
            filter.Q.value = 1 + ratioY*8
            if (freq < 1000 && filter.Q.value > 3){
              filter.Q.value = 3
            }
            efx.push(filter)
          }
          if (effect.property == 'delay'){
            let delay = effectPool.current[1]
            delay.set({feedback:ratioX})
            efx.push(delay)
          }
          if (effect.property == 'vibrato'){
            let vib = effectPool.current[2]
            vib.set({frequency:ratioX*10,depth:ratioY*0.25})
            efx.push(vib)
          }
          if (effect.property == 'distortion'){
            let dist = effectPool.current[3]
            dist.set({distortion:ratioX*0.1})
            efx.push(dist)
          }
        })
        if (efx.length > 0){
          efx[efx.length-1].toDestination()
          synth.chain(...efx)
        } else {
          synth.toDestination() //if no effect, directly output synth tone
        }
        
        const noteIndex = Math.floor((bubble.x / canvas.width) * lowScale.length);
        let note;
        if (bubble.property === 'low') {
          note = lowScale[noteIndex];
        } else if (bubble.property === 'mid') {
          note = midScale[noteIndex];
        } else if (bubble.property === 'high') {
          note = highScale[noteIndex];
        }
        synth.triggerRelease()
        synth.triggerAttack(note,time);
      });
    }, '4n').start(0);
    return () => loop.dispose();
  }, [bubbles, lowScale, midScale, highScale, dropout, effectBubbles, isLoading]);

  const start = () => {
    setIsPlaying(true);
    Tone.getTransport().start();
    requestRef.current = requestAnimationFrame(animate);
  };

  const stop = () => {
    setIsPlaying(false);
    Tone.getTransport().stop();
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const bpmChange = useCallback((event) => {
    const newBpm = event.target.value;
    setBpm(newBpm);
    Tone.getTransport().bpm.rampTo(newBpm, 0.1);
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = window.innerWidth * 0.55;
    canvas.height = window.innerHeight * 0.55;

    context.clearRect(0, 0, canvas.width, canvas.height);

    const draw = (bubble, index) => {
      bubble.x += bubble.vx;
      bubble.y += bubble.vy;

      // Collision detection
      if (bubble.x + bubble.radius > canvas.width || bubble.x - bubble.radius < 0) {
        bubble.vx *= -1;
      }
      if (bubble.y + bubble.radius > canvas.height || bubble.y - bubble.radius < 0) {
        bubble.vy *= -1;
      }

      const combined = [...bubbles, ...effectBubbles];
      for (let i = 0; i < combined.length; i++) {
        if (i !== index) {
          const otherBubble = combined[i];
          const dx = bubble.x - otherBubble.x;
          const dy = bubble.y - otherBubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < bubble.radius + otherBubble.radius) {
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // Rotate bubble's velocity
            const vx1 = bubble.vx * cos + bubble.vy * sin;
            const vy1 = bubble.vy * cos - bubble.vx * sin;
            const vx2 = otherBubble.vx * cos + otherBubble.vy * sin;
            const vy2 = otherBubble.vy * cos - otherBubble.vx * sin;

            // Exchange velocities
            const temp = vx1;
            bubble.vx = vx2 * cos - vy1 * sin;
            bubble.vy = vy1 * cos + vx2 * sin;
            otherBubble.vx = temp * cos - vy2 * sin;
            otherBubble.vy = vy2 * cos + temp * sin;
          }
        }
      }

      context.beginPath();
      context.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      context.fillStyle = bubble.color;
      context.fill();
      context.closePath();
    };

    const combined = [...bubbles,...effectBubbles]
    combined.forEach((bubble, index) => {
      draw(bubble, index);
    });

    requestRef.current = requestAnimationFrame(animate);

  }, [bubbles,effectBubbles]);

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, animate]);


  const dropNote = (e, noteType) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    const radius = Math.random() * 10 + 20;
    const color = noteType === 'low' ? '#FC6238' : noteType === 'mid' ? '#00A86B' : '#6C88C4';
    setBubbles((prevBubbles) => [...prevBubbles, { x, y, vx, vy, radius, color, property: noteType, inst: inst }]);
    setNoteLow(false);
    setNoteMid(false);
    setNoteHigh(false);
    if (!isPlaying) start();
  };

  const dropEffect = (e,effectType) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    const radius = Math.random() * 10 + 20;
    const color = 'dodgerblue'
    setEffectBubbles((prevBubbles) => [...prevBubbles, { x, y, vx, vy, radius, color, property: effectType }]);
    setFilter(false);
    setDelay(false)
    setVibrato(false)
    setDistortion(false)
  }

  const toggle = () => {
    if (isPlaying) {
      stop()
      return
    }
    start()
  }

  const reset = () => {
    setBubbles([])
    setEffectBubbles([])
  }

  const handleInstrumentClick = (instrument) => {
    setInst(instrument);
  };

  return (
    <div className='container'>
      <h1>Bubble Synth</h1>
      <canvas id='canvas' ref={canvasRef} onClick={(e) => { 
        if (noteLow) dropNote(e, 'low'); 
        else if (noteMid) dropNote(e, 'mid'); 
        else if (noteHigh) dropNote(e, 'high');
        else if (filter) dropEffect(e, 'filter');
        else if (delay) dropEffect(e, 'delay');
        else if (vibrato) dropEffect(e, 'vibrato');
        else if (distortion) dropEffect(e, 'distortion');
        }}></canvas>
      <p></p>
      <div className='notes'>
        <button className='note-button' style={{backgroundColor: '#FC6238'}} onClick={() => setNoteLow(true)}>Low Note</button>
        <button className='note-button' style={{backgroundColor: '#00A86B'}} onClick={() => setNoteMid(true)}>Mid Note</button>
        <button className='note-button' style={{backgroundColor: '#6C88C4'}} onClick={() => setNoteHigh(true)}>Hi Note</button>
        <div>
        <label htmlFor='bpm'>Trigger Rate: {bpm} BPM</label>
        <input type='range' id='bpm' min={20} max={600} step={2} value={bpm} onChange={bpmChange}></input>
      </div>
      <div>
        <label htmlFor='key'>Key</label>
        <select id='key' value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
          {keys.map((key) => (
            <option key={key} value={key}>{key}</option> 
          ))}
        </select>
      </div>
      <div>
        <label htmlFor='mode'>Tonality</label>
        <select id='mode' value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)}>
          {Object.keys(modes).map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
      </div>
      <div className='inst'>
        {insts.map((instrument) => (
          <button
            key={instrument}
            className={`instrument-button ${inst === instrument ? 'selected' : ''}`}
            onClick={() => handleInstrumentClick(instrument)}
          >
            {instrument}
          </button>
        ))}
        <button style={{backgroundColor: '#81c784'}} onClick={toggle}>{isPlaying ? 'pause' : 'play'}</button>
        <button style={{backgroundColor: '#e57373'}} onClick={reset}>reset</button>
      </div>
      <div className='left-panel'>
        <div className='efx'>
          <button className='note-button' style={{backgroundColor: 'dodgerblue', color: 'white'}} onClick={()=>setFilter(true)}>Filter</button>
          <button className='note-button' style={{backgroundColor: 'dodgerblue', color: 'white'}} onClick={()=>setDelay(true)}>Delay</button>
          <button className='note-button' style={{backgroundColor: 'dodgerblue', color: 'white'}} onClick={()=>setVibrato(true)}>Vibrato</button>
          <button className='note-button' style={{backgroundColor: 'dodgerblue', color: 'white'}} onClick={()=>setDistortion(true)}>Dist</button>
        </div>
      </div>
      <div className='right-panel'>
        <div>
          <label htmlFor='dropout'>Dropout</label>
          <input type='range' id='dropout' min={0} max={1} step={0.1} value={dropout} onChange={(e) => setDropout(e.target.value)} />
        </div>
        <div>
          <label htmlFor='attack'>Attack  </label>
          <input type='range' id='attack' min={0} max={2} step={0.1} value={attack} onChange={(e) => setAttack(e.target.value)} />
        </div>
        <div>
          <label htmlFor='decay'>Decay </label>
          <input type='range' id='decay' min={0.1} max={5} step={0.1} value={decay} onChange={(e) => setDecay(e.target.value)} />
        </div>
        <div>
          <label htmlFor='detune'>Detune</label>
          <input type='range' id='detune' min={0} max={50} step={1} value={detune} onChange={(e) => setDetune(e.target.value)} />
        </div>
        <div>
          <label htmlFor='slide'>Slide </label>
          <input type='range' id='slide' min={0} max={1} step={0.1} value={slide} onChange={(e) => setSlide(e.target.value)} />
        </div>
      </div>
      <button className='how-to-button' onClick={
        ()=>{
          var modal = document.getElementById('modal')
          if (modal.style.display == 'block'){
            modal.style.display = 'none'
          } else {
            modal.style.display = 'block'
          }   
        }
      }>?</button>
      <div className='modal' id='modal'>
        <div className='intro'>
          <p>Welcome to Bubble Synth! Generate morphing sounds by clicking on bubbles</p>
          <p>and dropping them on the canvas.</p>
          <p>Made with React and Tone.js, Created by <a href='https://blue-mirror.com'>Ethan Chen</a>💙</p>
        </div>
        <div className='firsthere'>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21L3 12H9V3H15V12H21L12 21Z" fill="currentColor"/>
          </svg>
        </div>
        <div className='here-are-notes'>
          <p><b>Start Here</b> by selecting note bubble and dropping it in canvas. Notes will be</p>
          <p>triggered based on horizontal location of the bubble.</p>
          <p>Adjust: Trigger BPM, Key and Scale, Instruments</p>
        </div>
        <div className='thenhere'>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12L12 21V15H21V9H12V3L3 12Z" fill="currentColor"/>
          </svg>
        </div>
        <div className='here-are-efx'>
          <p>Select effect bubbles and drop</p>
          <p>them to spice up your sound!</p>
          <p>The parameters are controlled</p>
          <p>by their location on canvas</p>
        </div>
        <div className='lasthere'>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12L12 3V9H3V15H12V21L21 12Z" fill="currentColor"/>
          </svg>
        </div>
        <div className='here-are-control'>
          <p>Adjust the control knob to</p>
          <p>finetune sound parameters</p>
          <p>Dropout: randomly skips notes</p>
        </div>
      </div>
    </div>
  );
};

export default Synth;