const video = document.getElementById("video");
let json_data = [];
fetch("./api.php")
  .then((response) => response.json())
  .then((data) => (json_data = data));

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
]).then((result) => {
  startVideo();
});
console.log(json_data);
function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", async () => {
  var i = 0;
  const labeledFaceDescriptors = await loadLabeledImages();
  if (i == 0) {
    i = 1;
    var elem = document.getElementById("myBar");
    var width = 1;
    var id = setInterval(frame, 10);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        i = 0;
      } else {
        width++;
        elem.style.width = width + "%";
        elem.innerHTML = width + "%";
      }
    }
  }
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawOptions = {
        anchorPosition: "TOP_LEFT",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      };
      const drawBox = new faceapi.draw.DrawTextField(
        result.toString(),
        box,
        drawOptions
      );
      // const drawBox = new faceapi.draw.DrawBox(box, {
      //   label: result.toString(),
      //   lineWidth: 2,
      // });
      drawBox.draw(canvas);
    });
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  }, 100);
});
async function loadLabeledImages() {
  let labels = [];
  for (var property in json_data) {
    await labels.push(property);
  }
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 0; i < json_data[label].length; i++) {
        const el = json_data[label][i];
        console.log(el);
        const img = await faceapi.fetchImage(`./labeled_images/${label}/${el}`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}
