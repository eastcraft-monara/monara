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

// ----------------------------------------------------------------------------
// B: 4 fingers straight up, thumb bent over palm
// ----------------------------------------------------------------------------
const letterB = new fp.GestureDescription('B');
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterB.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
}
letterB.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
letterB.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 0.9);
letters.B = letterB;

// ----------------------------------------------------------------------------
// C: All fingers half curled
// ----------------------------------------------------------------------------
const letterC = new fp.GestureDescription('C');
for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterC.addCurl(finger, fp.FingerCurl.HalfCurl, 1.0);
}
letters.C = letterC;

// ----------------------------------------------------------------------------
// G: Index and thumb pointing sideways (horizontal), others curled
// ----------------------------------------------------------------------------
const letterG = new fp.GestureDescription('G');
letterG.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterG.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 1.0);
letterG.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 1.0);
letterG.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 0.9);
for (let finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterG.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterG.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.G = letterG;

// ----------------------------------------------------------------------------
// H: Index and middle pointing sideways, others curled
// ----------------------------------------------------------------------------
const letterH = new fp.GestureDescription('H');
for (let finger of [fp.Finger.Index, fp.Finger.Middle]) {
  letterH.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
  letterH.addDirection(finger, fp.FingerDirection.HorizontalLeft, 1.0);
  letterH.addDirection(finger, fp.FingerDirection.HorizontalRight, 1.0);
}
for (let finger of [fp.Finger.Thumb, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterH.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterH.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.H = letterH;

// ----------------------------------------------------------------------------
// J: Pinky up, others curled (approx for static)
// ----------------------------------------------------------------------------
const letterJ = new fp.GestureDescription('J');
letterJ.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
letterJ.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalDownLeft, 0.9);
letterJ.addDirection(fp.Finger.Pinky, fp.FingerDirection.DiagonalDownRight, 0.9);
for (let finger of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  letterJ.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterJ.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.J = letterJ;

// ----------------------------------------------------------------------------
// K: Index straight up, middle straight out, thumb in between
// ----------------------------------------------------------------------------
const letterK = new fp.GestureDescription('K');
letterK.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterK.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
letterK.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
letterK.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.9);
for (let finger of [fp.Finger.Ring, fp.Finger.Pinky]) {
  letterK.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterK.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.K = letterK;

// ----------------------------------------------------------------------------
// L: Index straight up, thumb horizontal, others curled
// ----------------------------------------------------------------------------
const letterL = new fp.GestureDescription('L');
letterL.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterL.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterL.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterL.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.L = letterL;

// ----------------------------------------------------------------------------
// M: Thumb tucked under index, middle, ring. All fingers curled.
// ----------------------------------------------------------------------------
const letterM = new fp.GestureDescription('M');
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  letterM.addCurl(finger, fp.FingerCurl.HalfCurl, 1.0);
  letterM.addCurl(finger, fp.FingerCurl.FullCurl, 0.9);
}
letterM.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
letterM.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
letters.M = letterM;

// ----------------------------------------------------------------------------
// N: Thumb tucked under index and middle. All fingers curled.
// ----------------------------------------------------------------------------
const letterN = new fp.GestureDescription('N');
for (let finger of [fp.Finger.Index, fp.Finger.Middle]) {
  letterN.addCurl(finger, fp.FingerCurl.HalfCurl, 1.0);
  letterN.addCurl(finger, fp.FingerCurl.FullCurl, 0.9);
}
letterN.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
letterN.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
letterN.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
letters.N = letterN;

// ----------------------------------------------------------------------------
// P: Index forward, middle pointing down, thumb out (K downwards)
// ----------------------------------------------------------------------------
const letterP = new fp.GestureDescription('P');
letterP.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterP.addCurl(fp.Finger.Middle, fp.FingerCurl.HalfCurl, 1.0);
letterP.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Ring, fp.Finger.Pinky]) {
  letterP.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}
letters.P = letterP;

// ----------------------------------------------------------------------------
// Q: Index and thumb pointing down
// ----------------------------------------------------------------------------
const letterQ = new fp.GestureDescription('Q');
letterQ.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterQ.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
letterQ.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalDown, 1.0);
letterQ.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownLeft, 0.9);
letterQ.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalDownRight, 0.9);
for (let finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterQ.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}
letters.Q = letterQ;

// ----------------------------------------------------------------------------
// U: Index and middle straight up (together)
// ----------------------------------------------------------------------------
const letterU = new fp.GestureDescription('U');
letterU.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterU.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterU.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterU.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.U = letterU;

// ----------------------------------------------------------------------------
// V: Index and middle straight up (apart)
// ----------------------------------------------------------------------------
const letterV = new fp.GestureDescription('V');
letterV.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterV.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
letterV.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 1.0);
letterV.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpRight, 1.0);
letterV.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 1.0);
letterV.addDirection(fp.Finger.Middle, fp.FingerDirection.DiagonalUpLeft, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterV.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterV.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.V = letterV;

// ----------------------------------------------------------------------------
// X: Index half curled (hook shape)
// ----------------------------------------------------------------------------
const letterX = new fp.GestureDescription('X');
letterX.addCurl(fp.Finger.Index, fp.FingerCurl.HalfCurl, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterX.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
}
letters.X = letterX;

// ----------------------------------------------------------------------------
// Y: Thumb and pinky straight out
// ----------------------------------------------------------------------------
const letterY = new fp.GestureDescription('Y');
letterY.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
letterY.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);
for (let finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  letterY.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterY.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.Y = letterY;

// ----------------------------------------------------------------------------
// Z: Index straight out (approx for static Z)
// ----------------------------------------------------------------------------
const letterZ = new fp.GestureDescription('Z');
letterZ.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
letterZ.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft, 1.0);
letterZ.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 1.0);
for (let finger of [fp.Finger.Thumb, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  letterZ.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  letterZ.addCurl(finger, fp.FingerCurl.HalfCurl, 0.9);
}
letters.Z = letterZ;

export const ALL_GESTURES = Object.values(letters);
