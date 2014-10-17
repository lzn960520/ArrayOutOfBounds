$.getScript("js/modules/problem.js", function() {
  if (onactive[currentGUI()])
    onactive[currentGUI()]();
});
enableTab("contests");
if (isNAV(1))
  switchNAV(0);
