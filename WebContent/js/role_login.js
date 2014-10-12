$.getScript("js/modules/problem.js", function() {
  if (onactive[currentGUI()])
    onactive[currentGUI()]();
});
$.getScript("js/modules/contest.js", function() {
  if (onactive[currentGUI()])
    onactive[currentGUI()]();
});
if (isNAV(0)) {
  switchGUI("problems");
  switchNAV(1);
}
