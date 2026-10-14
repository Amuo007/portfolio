import { Block, BlockSection, Callout, Fns, H2, Ifs, PageHead, QA, RecipeBar, Settings, Term } from "../components";
import { OriginalLinks } from "./Notebooks";

export default function Images() {
  return (
    <>
      <PageHead kicker="HW01 · HW02 Part A" title="Image basics (OpenCV)" likely="mid">
        Load an image, count <Term k="pixel">pixels</Term>, split color <Term k="channel">channels</Term>, plot{" "}
        <Term k="histogram">histograms</Term>, convert to <Term k="grayscale">grayscale</Term>, and{" "}
        <Term k="threshold">threshold</Term>.
      </PageHead>

      <RecipeBar id="image" />

      <Callout type="warn" title="The one trap">
        <code>cv2.imread</code> gives <Term k="bgr">BGR</Term>, not RGB. Always convert before plotting (<code>load_image</code> does it for you),
        otherwise the cat looks blue.
      </Callout>

      <H2 id="settings">Settings</H2>
      <Settings
        rows={[
          ["IMAGE_PATH", "Image file next to the notebook.", <code>"cat.png"</code>],
          ["T", "Threshold: pixels above T turn white (255), the rest black (0).", "127; or threshold(gray, mode=\"otsu\") to pick it automatically"],
        ]}
      />

      <BlockSection id="image_basics">
        <Fns
          rows={[
            ["load_image(path)", "Reads the file and converts BGR → RGB.", "H × W × 3 array"],
            ["show(img, title) / show_grid(images, titles)", "Display one / several images (gray detected automatically).", "—"],
            ["image_info(img)", "Height, width, channels, pixel count.", "dict"],
            ["split_channels(img)", "Separate R, G, B (each a 2-D gray image).", "R, G, B"],
            ["to_gray(img)", "RGB → grayscale (0.299 R + 0.587 G + 0.114 B).", "H × W array"],
            ["histogram(channel) / plot_histogram(img)", "Unnormalized counts for values 0..255 (one line per channel for RGB).", "256 counts"],
            ["threshold(gray, T, mode)", <>mode: "binary", "inverse", "otsu" (auto T), "adaptive" (per area).</>, "0/255 image"],
            ["resize, blur, equalize, canny_edges", "Resize, Gaussian blur (odd k), histogram equalization (more contrast), edge map.", "image"],
          ]}
        />
        <Block id="image_basics" />
      </BlockSection>

      <BlockSection id="image_recipe">
        <p>Every HW01 task (a–g, then Part B a–b) in order, with the numbers needed for the written answers.</p>
        <Block id="image_recipe" />
      </BlockSection>

      <BlockSection id="image_skimage">
        <p>
          scikit-image is in the install list. It reads RGB directly (no BGR problem) and works with values 0–1.
        </p>
        <Block id="image_skimage" />
      </BlockSection>

      <H2 id="ifs">Variations</H2>
      <Ifs
        rows={[
          ["Normalized histogram (percentages)", <code>h = histogram(gray); h = h / h.sum()</code>],
          ["All 3 channel histograms in one plot", <code>plot_histogram(img)</code>],
          ["Inverse threshold", <code>threshold(gray, 127, mode="inverse")</code>],
          ["Automatic threshold", <code>threshold(gray, mode="otsu")</code>],
          ["Load an image from a URL", <><code>import requests; open("x.jpg", "wb").write(requests.get(url).content)</code> then <code>load_image("x.jpg")</code></>],
          ["Save a result", <code>cv2.imwrite("out.png", cv2.cvtColor(img, cv2.COLOR_RGB2BGR))</code>],
          ["Crop", <code>img[y1:y2, x1:x2]</code>],
        ]}
      />

      <H2 id="theory">Theory answers (HW01 Part B)</H2>
      <QA q="What differences do you see in the histograms of the color channels?">
        The three shapes are similar (same scene), but blue is shifted toward darker values (mean 86.5 vs ~94 for red and
        green). Red and green are brighter, so the image has a warm tone. All three peak in the dark range (~20–24).
      </QA>
      <QA q="Is converting to grayscale the same as isolating a color channel? Why?">
        No. One channel keeps only red, green or blue. Grayscale combines all three with weights that match human
        brightness perception (0.299 R + 0.587 G + 0.114 B). Both give a 1-channel image, but with different values.
      </QA>
      <QA q="Differences between the grayscale and thresholded histograms?">
        The grayscale histogram is spread over all 256 values (many shades). The thresholded one has only two spikes, at 0
        and 255, because every pixel became black or white. The total pixel count is the same (651,420): gray bins 0–127
        add up to the black pixels (469,430) and bins 128–255 to the white ones (181,990). Thresholding throws away the
        shading detail.
      </QA>

      <OriginalLinks topic="image" />
    </>
  );
}
