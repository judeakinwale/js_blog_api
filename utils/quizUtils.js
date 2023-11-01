const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuizResponse = require("../models/QuizResponse");
const ErrorResponse = require("./errorResponse");
const UserQuiz = require("../models/UserQuiz");
const { toDecimal } = require("./utils");

exports.getQuizDetails = async (quiz) => {
  return quiz;
};

exports.updateUserQuizPayload = async (payload) => {
  const { quiz: quizId, user } = payload;
  if (!quizId) throw new ErrorResponse("Please provide a quiz", 400);
  if (!user) throw new ErrorResponse("Please provide a user", 400);

  const [quiz, quizResponses] = await Promise.all([
    await Quiz.findById(quizId).populate("questions"),
    await QuizResponse.find({
      quiz: payload?.quiz,
      user: payload?.user,
    }),
  ]);
  // const quiz = await Quiz.findById(quizId).populate("questions");
  // const quizResponses = await QuizResponse.find({
  //   quiz: payload?.quiz,
  //   user: payload?.user,
  // });
  const quizQuestions = quiz?.questions;
  const rawScore = quizResponses.reduce(
    (prev, q) => prev + Number(q?.score || q?.isCorrect),
    0
  );
  const maxQuestionScore =
    quizQuestions.reduce((prev, q) => prev + Number(q?.score || 1), 0) || 1;

  // console.log({
  //   quiz,
  //   quizResponses: quizResponses?.length,
  //   quizQuestions: quizQuestions?.length,
  //   rawScore,
  //   maxQuestionScore,
  // });

  if (rawScore > maxQuestionScore)
    throw new ErrorResponse("Error: rawScore > maxQuestionScore", 500);
  if (quizResponses.length > quizQuestions.length)
    throw new ErrorResponse("Error: quizResponses > quizQuestions", 500);

  payload.responses = quizResponses.map((q) => q._id);
  payload.score = (rawScore / maxQuestionScore) * quiz?.maxScore;
  payload.percentageScore = (rawScore / maxQuestionScore) * 100;
  payload.isPassed = payload.percentageScore >= 60;
  payload.points = (rawScore / maxQuestionScore) * quiz?.maxPoints;
  payload.percentageCompletion =
    (quizResponses.length / (quizQuestions.length || 1)) * 100;
  payload.isCompleted = quizResponses.length >= (quizQuestions.length || 1);

  if (isNaN(payload.percentageScore)) payload.percentageScore = 0;
  if (payload.percentageCompletion && !payload.isCompleted)
    payload.status = "Started";
  if (payload.isCompleted) payload.status = "Completed";

  // ? fix property decimal representation
  payload.score = toDecimal(payload.score);
  payload.points = toDecimal(payload.points);
  payload.percentageScore = toDecimal(payload.percentageScore);
  payload.percentageCompletion = toDecimal(payload.percentageCompletion);

  // console.log({ payload });
  return payload;
};

exports.createOrUpdateUserQuiz = async (payload) => {
  await this.updateUserQuizPayload(payload);

  const { quiz, user } = payload;
  if (!quiz || !user)
    throw new ErrorResponse(`quiz or user not provided!`, 404);

  // delete _id from the payload (if in payload)
  delete payload._id

  const data = await UserQuiz.findOneAndUpdate({ quiz, user }, payload, upsertOptions);
  if (!data) throw new ErrorResponse(`UserQuiz not found!`, 404);

  return data;
};
