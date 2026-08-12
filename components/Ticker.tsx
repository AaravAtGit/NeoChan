export default function Ticker() {
  const text = "RULE #1: ANONYMOUS IS MANDATORY ★ RULE #2: SAGE IS CULTURE ★ RULE #3: NO PERSONAL INFO ★ RULE #4: IMAGES OR IT DIDN'T HAPPEN ★ RULE #5: CHECK BEFORE POSTING ★ ";
  return (
    <div className="ticker">
      <div className="ticker-inner">{text}{text}</div>
    </div>
  );
}