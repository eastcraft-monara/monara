import * as fp from "fingerpose";

const letters = {};

// ----------------------------------------------------------------------------
// A: Fist with thumb straight up/diagonal
// ----------------------------------------------------------------------------
const letterA = new fp.GestureDescription('A');
letterA.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterA.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterA.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.A = letterA;

// ----------------------------------------------------------------------------
// D: Index pointing up, others curled
// ----------------------------------------------------------------------------
const letterD = new fp.GestureDescription('D');
letterD.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterD.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterD.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.D = letterD;

// ----------------------------------------------------------------------------
// E: All fingers curled tightly
// ----------------------------------------------------------------------------
const letterE = new fp.GestureDescription('E');
for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterE.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterE.addCurl(finger, fp.FingerCurl.HalfCurl, 0.8);
}
letters.E = letterE;

// ----------------------------------------------------------------------------
// F: Index and Thumb touching (curled), others straight up
// ----------------------------------------------------------------------------
const letterF = new fp.GestureDescription('F');
letterF.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
letterF.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
letterF.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 1.0);
letterF.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
for (let finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterF.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
}
letters.F = letterF;

// ----------------------------------------------------------------------------
// I: Pinky up, others curled
// ----------------------------------------------------------------------------
const letterI = new fp.GestureDescription('I');
letterI.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  letterI.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterI.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.I = letterI;

// ----------------------------------------------------------------------------
// O: All fingers half curled forming a circle
// ----------------------------------------------------------------------------
const letterO = new fp.GestureDescription('O');
for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterO.addCurl(finger, fp.FingerCurl.HalfCurl, 1.0);
  letterO.addDirection(finger, fp.FingerDirection.DiagonalUpLeft, 0.9);
  letterO.addDirection(finger, fp.FingerDirection.DiagonalUpRight, 0.9);
}
letters.O = letterO;

// ----------------------------------------------------------------------------
// R: Index and middle straight up (crossed, but we check NoCurl), others curled
// ----------------------------------------------------------------------------
const letterR = new fp.GestureDescription('R');
letterR.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterR.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterR.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterR.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.R = letterR;

// ----------------------------------------------------------------------------
// S: Fist (Thumb over fingers)
// ----------------------------------------------------------------------------
const letterS = new fp.GestureDescription('S');
for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterS.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}
letters.S = letterS;

// ----------------------------------------------------------------------------
// T: Thumb under index (Thumb half curl, Index full curl)
// ----------------------------------------------------------------------------
const letterT = new fp.GestureDescription('T');
letterT.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
letterT.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.9);
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterT.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}
letters.T = letterT;

// ----------------------------------------------------------------------------
// W: Index, middle, ring straight up. Thumb and pinky curled
// ----------------------------------------------------------------------------
const letterW = new fp.GestureDescription('W');
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  letterW.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
}
letterW.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
letterW.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.9);
letterW.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
letterW.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.9);
letters.W = letterW;


export const ALL_GESTURES = Object.values(letters);
