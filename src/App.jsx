import { useState } from "react";
import { reduce } from "./lib/util.js";
import Ambient from "./components/Ambient.jsx";
import Progress from "./components/Progress.jsx";
import SoundButton from "./components/SoundButton.jsx";
import Kitchen from "./components/Kitchen.jsx";
import Recipe from "./components/Recipe.jsx";
import Story from "./components/Story.jsx";
import Catcher from "./components/Catcher.jsx";
import Multiverse from "./components/Multiverse.jsx";
import Wish from "./components/Wish.jsx";
import Packet from "./components/Packet.jsx";
import Ending from "./components/Ending.jsx";

export default function App() {
  const [round, setRound] = useState(1);
  const replay = () => {
    setRound((r) => r + 1);
    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <>
      <Ambient />
      <Progress />
      <Kitchen round={round} />
      <main>
        <Recipe />
        <Story />
        <Catcher />
        <Multiverse />
        <Wish />
        <Packet />
        <Ending onReplay={replay} />
      </main>
      <footer>Made by your best friend, from scratch, for October 12, 2026.</footer>
      <SoundButton />
    </>
  );
}
