-- File generated by the BNF Converter (bnfc 2.9.4.1).

-- Templates for pattern matching on abstract syntax

{-# OPTIONS_GHC -fno-warn-unused-matches #-}

module SkelStately where

import Prelude (($), Either(..), String, (++), Show, show)
import qualified AbsStately

type Err = Either String
type Result = Err String

failure :: Show a => a -> Result
failure x = Left $ "Undefined case: " ++ show x

transIdent :: AbsStately.Ident -> Result
transIdent x = case x of
  AbsStately.Ident string -> failure x

transStm :: AbsStately.Stm -> Result
transStm x = case x of
  AbsStately.Assign ident exp -> failure x
  AbsStately.Block stms -> failure x
  AbsStately.While exp stm -> failure x
  AbsStately.If exp stm1 stm2 -> failure x
  AbsStately.AWait val -> failure x
  AbsStately.AFail -> failure x
  AbsStately.ASucc -> failure x

transExp :: AbsStately.Exp -> Result
transExp x = case x of
  AbsStately.EVal val -> failure x
  AbsStately.ETask val1 val2 -> failure x

transVal :: AbsStately.Val -> Result
transVal x = case x of
  AbsStately.VString string -> failure x
  AbsStately.VNumber integer -> failure x
  AbsStately.VBoolean boolean -> failure x

transBoolean :: AbsStately.Boolean -> Result
transBoolean x = case x of
  AbsStately.BTrue -> failure x
  AbsStately.BFalse -> failure x
