import { useEffect, useState } from "react";
import { Sound, setSound } from "../lib/sound.js";

export default function SoundButton() {
  const [on, setOn] = useState(Sound.on);
  useEffect(() => { Sound.subs.add(setOn); return () => Sound.subs.delete(setOn); }, []);
  return (
    <button className={"snd" + (on ? " on" : "")} aria-pressed={on} aria-label={on ? "Turn sound off" : "Turn sound on"} onClick={() => setSound(!on)}>
      <span className="eq"><i /><i /><i /></span>
      <span className="lab">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
