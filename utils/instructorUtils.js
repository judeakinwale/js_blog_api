// Grouping objects by their 'type' or any other key
const groupedObjects = (objectsList, key = "type") =>
  objectsList.reduce((acc, obj) => {
    const type = obj[key];
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(obj);
    return acc;
  }, {});

// Convert the grouped objects into an array
const groupedObjectsList = (groupedObjects) =>
  Object.entries(groupedObjects).map(([key, value]) => ({
    type: key,
    objects: value,
  }));

const getGroupedObjects = (objectsList, key = "type", value = "objects") => {
  const grouped = groupedObjects(objectsList, key);
  const groupedList = groupedObjectsList(grouped);
  return groupedList;
};

exports.getInstructorCourseDetails = async (userCourses) => {
  const groupedRes = getGroupedObjects(userCourses, "course");
  console.log({ groupedRes });
};
