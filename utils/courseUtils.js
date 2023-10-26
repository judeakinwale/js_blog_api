const CourseSection = require("../models/CourseSection");
const CourseDocument = require("../models/CourseDocument");
const CourseVideo = require("../models/CourseVideo");
const UserCourse = require("../models/UserCourse");
const Course = require("../models/Course");
// const Book = require("../models/Book");
const Quiz = require("../models/Quiz");
const Review = require("../models/Review");
const { getQuizDetails } = require("./quizUtils");
const { sortArrayOfObjects } = require("./utils");
// const Announcement = require("../models/Announcement");

exports.populateCourse = [
  { path: "categories" },
  { path: "tags" },
  { path: "instructors" },
  { path: "features", populate: { path: "feature" } },
  // { path: "feature" },
  { path: "favoritedBy" },
  { path: "createdBy" },
];

exports.populateAnnouncement = [
  { path: "createdBy" },
  { path: "course" },
  {
    path: "comments",
    populate: "user",
  },
];

exports.getCourseResources = async (course) => {
  const [documents, videos, quizzes] = await Promise.all([
    await CourseDocument.find({ course: course._id }),
    await CourseVideo.find({ course: course._id }),
    await Quiz.find({ course: course._id }).populate("questions"),
  ]);
  // const documents = await CourseDocument.find({ course: course._id });
  // const videos = await CourseVideo.find({ course: course._id });
  // const quizzes = await Quiz.find({ course: course._id }).populate("questions");
  const videoCount = videos.length;
  const lectureCount = videoCount + documents.length;
  const resourceCount = lectureCount + quizzes.length;
  console.log({ videoCount, lectureCount, resourceCount });
  return {
    documents,
    videos,
    quizzes,
    videoCount,
    lectureCount,
    resourceCount,
  };
};

exports.getCourseDetails = async (course, onlyEnrolledStudents = false) => {
  if (!course) return;

  const userCourses = await UserCourse.find({ course: course._id }).populate(
    "user"
  );
  if (onlyEnrolledStudents) {
    return { ...course.toObject(), enrolledStudents: userCourses };
  }

  const [sections, documents, videos, quizzes, reviews] = await Promise.all([
    await CourseSection.find({ course: course._id }),
    await CourseDocument.find({ course: course._id }),
    await CourseVideo.find({ course: course._id }),
    await Quiz.find({ course: course._id }).populate("questions"),
    await Review.find({ course: course._id }).populate("user"),
  ]);

  // const sections = await CourseSection.find({ course: course._id });
  // const documents = await CourseDocument.find({ course: course._id });
  // const videos = await CourseVideo.find({ course: course._id });
  // const quizzes = await Quiz.find({ course: course._id }).populate("questions");
  // const reviews = await Review.find({ course: course._id }).populate("user");
  // // const announcements = await Announcement.find({ course: course._id }).populate(populateAnnouncement);
  // // const books = await Book.find({course: course._id});

  let totalRating = 0;
  for (const review of reviews) totalRating += Number(review.rating || 0);
  const averageRating = totalRating / reviews.length || 0;

  const detailedQuizzes = await Promise.all(
    quizzes.map(async (q) => await getQuizDetails(q))
  );

  // sort the section by order if order is provided, else sort by createdAt
  const orderedSections = sortArrayOfObjects(sections, "order").map((s, i) => {
    s.order = i + 1;
    return s;
  });

  const detailedSections = await Promise.all(
    orderedSections.map(
      async (s) =>
        await this.getCourseSectionDetails(
          s,
          videos,
          documents,
          detailedQuizzes
        )
    )
  );

  const courseVideos = videos.filter((b) => !b.courseSection);
  const courseDocuments = documents.filter((b) => !b.courseSection);
  const courseQuizzes = detailedQuizzes.filter((b) => !b.courseSection);
  // const courseBooks = books.filter((b) => !b.courseSection);
  const videoCount = videos.length;
  const lectureCount = videoCount + documents.length;
  const resourceCount = lectureCount + detailedQuizzes.length;

  const result = {
    ...course.toObject(),
    sections: detailedSections,
    videos: courseVideos,
    documents: courseDocuments,
    quizzes: courseQuizzes,
    enrolledStudents: userCourses,
    videoCount: videoCount,
    lectureCount: lectureCount,
    resourceCount: resourceCount,
    averageRating: averageRating,
    reviews: reviews,
    // books: courseBooks,
    // announcements: announcements,
  };
  return result;
};

exports.getCourseSectionDetails = async (
  section,
  videos = undefined,
  documents = undefined,
  quizzes = undefined,
  books = undefined
) => {
  if (!section) return;
  // return section;

  let relatedBooks;
  let relatedVideos;
  let relatedDocuments;
  let relatedQuizzes;
  let relatedResources;

  // console.log({
  //   // section,
  //   // books,
  //   // videos,
  //   // documents,
  //   // quizzes,
  // });

  if (books)
    relatedBooks = books.filter(
      (b) => String(b.courseSection) == String(section._id)
    );
  if (videos)
    relatedVideos = videos.filter(
      (b) => String(b.courseSection) == String(section._id)
    );
  if (documents)
    relatedDocuments = documents.filter(
      (b) => String(b.courseSection) == String(section._id)
    );
  if (quizzes)
    relatedQuizzes = quizzes.filter(
      (b) => String(b.courseSection) == String(section._id)
    );

  // if (!books) relatedBooks = await Book.find({courseSection: section._id})
  if (!videos)
    relatedVideos = await CourseVideo.find({ courseSection: section._id });
  if (!documents)
    relatedDocuments = await CourseDocument.find({
      courseSection: section._id,
    });
  if (!quizzes) {
    const sectionQuizzes = await Quiz.find({
      courseSection: section._id,
    }).populate("questions");
    relatedQuizzes = await Promise.all(
      sectionQuizzes.map(async (q) => await getQuizDetails(q))
    );

    // const detailedQuizzes = []
    // for (const quiz of sectionQuizzes) {
    //   const result = await getQuizDetails(quiz)
    //   detailedQuizzes.push(result)
    // }
    // relatedQuizzes = detailedQuizzes
  }

  // console.log({
  //   // relatedBooks,
  //   // relatedVideos,
  //   // relatedDocuments,
  //   // relatedQuizzes,
  // });

  const typedVideos = relatedVideos.map((r) => {
    r = r && r.toObject();
    r.type = "video";
    return r;
  });
  const typedDocuments = relatedDocuments.map((r) => {
    r = r && r.toObject();
    r.type = "document";
    return r;
  });
  const typedQuizzes = relatedQuizzes.map((r) => {
    // ? Response from related quizzes is already list of objects
    r.type = "quiz";
    return r;
  });

  const typedResources = [...typedVideos, ...typedDocuments, ...typedQuizzes];
  // console.log({typedResources })
  const sortedResources = sortArrayOfObjects(typedResources, "order");
  const orderedResources = sortedResources.map((s, i) => {
    s.order = i + 1;
    return s;
  });
  relatedResources = [...orderedResources];

  const result = {
    ...section.toObject(),
    books: relatedBooks,
    videos: relatedVideos,
    documents: relatedDocuments,
    quizzes: relatedQuizzes,
    resources: relatedResources,
  };
  return result;
};

exports.getCategoryDetails = async (category, searchQuery = "") => {
  if (!category) return;
  console.log({ searchQuery });

  async function getCategoryCourses(
    catId,
    searchQuery = undefined,
    populate = ""
  ) {
    const q = searchQuery ? { $text: { $search: searchQuery } } : {};
    return await Course.find({ categories: catId, ...q }).populate(populate);
  }

  async function getCourseDetailsMin(courseId) {
    const [videos, reviews] = await Promise.all([
      await CourseVideo.find({ course: courseId }),
      await Review.find({ course: courseId }),
    ])
    // const videos = await CourseVideo.find({ course: courseId });
    // const reviews = await Review.find({ course: courseId });
    return { videos, reviews };
  }

  const courses = await getCategoryCourses(
    category._id,
    searchQuery,
    this.populateCourse
  );
  console.log({ coursesLength: courses.length });

  const categoryVideos = [];
  const updatedCourses = await Promise.all(
    courses.map(async (c) => {
      const details = await getCourseDetailsMin(c._id);
      categoryVideos.push(...details.videos);
      return {
        ...c.toObject(),
        ...details,
        reviewCount: details.reviews.length,
      };
    })
  );

  const result = {
    ...category.toObject(),
    courses: updatedCourses,
    videos: categoryVideos,
  };
  return result;
};

exports.getReviewDetails = async (review) => {
  if (!review) return;
  return review;
};

exports.getTagDetails = async (tag) => {
  if (!tag) return;

  const courses = await Course.find({ tags: tag._id });
  const result = {
    ...tag.toObject(),
    courses: courses,
  };
  return result;
};

exports.setCreatedByToInstructor = async () => {
  const courses = await Course.find();
  for (const course of courses) {
    const instructorList = course.instructors.map((i) => {
      if (i) return String(i);
    });
    let setInstructors = [];
    if (course.createdBy) {
      console.log("has created by");
      setInstructors = new Set([...instructorList, String(course.createdBy)]);
    } else {
      setInstructors = instructorList;
    }

    course.instructors = [...setInstructors];
    console.log(course.createdBy, { instructorList, setInstructors });
    await course.save();
  }
};

// exports.updateCourseDuration = async (courseId) => {
//   // const allVideos = await CourseVideo.find({course: courseId})
//   // let totalDuration = 0
//   // for (const video of allVideos) {
//   //   duration = video.duration && typeof video.duration == "number"? Number(video.duration) : 0;
//   //   totalDuration += duration
//   // }
//   // console.log({totalDuration})
//   // await Course.findByIdAndUpdate(courseId, { expectedDuration: totalDuration});
// };

exports.updateCourseDuration = async (courseId) => {
  const courseVideos = await CourseVideo.find({ course: courseId });
  let courseDuration = 0;
  for (const video of courseVideos) {
    courseDuration += Number(video.duration || 0);
  }
  const updatedCourse = await Course.findByIdAndUpdate(courseId, {
    expectedDuration: courseDuration,
  });
  return updatedCourse;
};

// function tryCatch(fn) {
//   try {
//     return function (...args)  {
//       return fn(...args)
//     }
//   } catch (error) {

//   }
// }

// function tryCatch(fn) {
//   try {
//     return fn
//   } catch (error) {
//     console.log(error)
//   }
// }

exports.saveAllCourses = async () => {
  const courses = await Course.find();
  for (const course of courses) {
    try {
      await course.save();
    } catch (err) {
      console.log({ err: err.message });
    }

    console.log("course saved -", course._id);
  }
  // courses.forEach(c => await c.save());
};
