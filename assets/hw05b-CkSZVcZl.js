const n="hw05b",e="HW05 Part B",o="VGG16: visualize what filters learn (Keras)",t="HW05-PartB-Report-Singh.ipynb",a="keras",r=[{t:"md",s:`# HW05 – Part B
name Amrinder singh`},{t:"code",s:`import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt

from tensorflow import keras`},{t:"md",s:"### Cell 3 — Load VGG16"},{t:"code",s:`model = keras.applications.VGG16(
    weights="imagenet",
    include_top=False
)`},{t:"code",s:"model.summary()",o:`Model: "vgg16"
_________________________________________________________________
 Layer (type)                Output Shape              Param #   
=================================================================
 input_1 (InputLayer)        [(None, None, None, 3)]   0         
 block1_conv1 (Conv2D)       (None, None, None, 64)    1792      
 block1_conv2 (Conv2D)       (None, None, None, 64)    36928     
 block1_pool (MaxPooling2D)  (None, None, None, 64)    0         
 block2_conv1 (Conv2D)       (None, None, None, 128)   73856     
 block2_conv2 (Conv2D)       (None, None, None, 128)   147584    
 block2_pool (MaxPooling2D)  (None, None, None, 128)   0         
 block3_conv1 (Conv2D)       (None, None, None, 256)   295168    
 block3_conv2 (Conv2D)       (None, None, None, 256)   590080    
 block3_conv3 (Conv2D)       (None, None, None, 256)   590080    
 block3_pool (MaxPooling2D)  (None, None, None, 256)   0         
 block4_conv1 (Conv2D)       (None, None, None, 512)   1180160   
 block4_conv2 (Conv2D)       (None, None, None, 512)   2359808   
 block4_conv3 (Conv2D)       (None, None, None, 512)   2359808   
 block4_pool (MaxPooling2D)  (None, None, None, 512)   0         
 block5_conv1 (Conv2D)       (None, None, None, 512)   2359808   
 block5_conv2 (Conv2D)       (None, None, None, 512)   2359808   
 block5_conv3 (Conv2D)       (None, None, None, 512)   2359808   
 block5_pool (MaxPooling2D)  (None, None, None, 512)   0         
=================================
...`},{t:"md",s:`## Target Layers

- conv1_1 → block1_conv1
- conv2_1 → block2_conv1
- conv3_1 → block3_conv1
- conv4_1 → block4_conv1
- conv5_1 → block5_conv1`},{t:"code",s:`target_layers = [
    "block1_conv1",
    "block2_conv1",
    "block3_conv1",
    "block4_conv1",
    "block5_conv1"
]`},{t:"code",s:`layer_name = "block1_conv1"

layer = model.get_layer(name=layer_name)

print(layer.name)
print(layer.output.shape)`,o:`block1_conv1
(None, None, None, 64)`},{t:"code",s:`feature_extractor = keras.Model(
    inputs=model.inputs,
    outputs=layer.output
)`},{t:"code",s:"filter_index = 0"},{t:"code",s:`img = tf.random.uniform(
    shape=(1, 128, 128, 3),
    minval=0.4,
    maxval=0.6
)`},{t:"code",s:`plt.imshow(img[0])
plt.axis("off")
plt.show()`,fig:!0},{t:"code",s:`activation = feature_extractor(img)

print(activation.shape)`,o:"(1, 128, 128, 64)"},{t:"code",s:`filter_activation = activation[:, :, :, filter_index]

print(filter_activation.shape)`,o:"(1, 128, 128)"},{t:"code",s:`loss = tf.reduce_mean(filter_activation)

print(loss.numpy())`,o:"0.74808013"},{t:"code",s:`with tf.GradientTape() as tape:
    tape.watch(img)

    activation = feature_extractor(img)
    filter_activation = activation[:, :, :, filter_index]
    loss = tf.reduce_mean(filter_activation)

grads = tape.gradient(loss, img)`},{t:"code",s:"grads = tf.math.l2_normalize(grads)"},{t:"code",s:`learning_rate = 10.0

img = img + learning_rate * grads`},{t:"code",s:`def generate_filter_pattern(layer_name, filter_index, steps=30):

    layer = model.get_layer(name=layer_name)

    feature_extractor = keras.Model(
        inputs=model.inputs,
        outputs=layer.output
    )

    img = tf.random.uniform(
        shape=(1, 128, 128, 3),
        minval=0.4,
        maxval=0.6
    )

    for step in range(steps):

        with tf.GradientTape() as tape:
            tape.watch(img)

            activation = feature_extractor(img)

            filter_activation = activation[:, :, :, filter_index]

            loss = tf.reduce_mean(filter_activation)

        grads = tape.gradient(loss, img)

        grads = tf.math.l2_normalize(grads)

        img = img + 10.0 * grads

    return img[0]`},{t:"code",s:`pattern = generate_filter_pattern(
    "block1_conv1",
    filter_index=0
)`},{t:"code",s:`plt.imshow(np.clip(pattern, 0, 1))
plt.axis("off")
plt.show()`,fig:!0},{t:"code",s:`def show_first_8_filters(layer_name):

    plt.figure(figsize=(12, 6))

    for i in range(8):

        pattern = generate_filter_pattern(
            layer_name,
            filter_index=i
        )

        plt.subplot(2, 4, i + 1)

        plt.imshow(np.clip(pattern, 0, 1))

        plt.title(f"Filter {i + 1}")

        plt.axis("off")

    plt.suptitle(layer_name)

    plt.tight_layout()

    plt.show()`},{t:"code",s:'show_first_8_filters("block1_conv1")',fig:!0},{t:"md",s:`### Observation – conv1_1

The filters in the first convolutional layer respond to simple visual features. 
The patterns mainly represent basic colors, edges, and different orientations of lines.`},{t:"code",s:'show_first_8_filters("block2_conv1")',fig:!0},{t:"md",s:`### Observation – conv2_1

The filters begin to respond to combinations of simple features. 
The patterns are more complex than the first layer and include textures, lines, and color combinations.`},{t:"code",s:'show_first_8_filters("block3_conv1")',fig:!0},{t:"md",s:`### Observation – conv3_1

The filters learn more complex textures and shapes. 
The patterns are less like simple edges and show combinations of features learned by earlier layers.`},{t:"code",s:'show_first_8_filters("block4_conv1")',fig:!0},{t:"md",s:`### Observation – conv4_1

The filters respond to more abstract and complicated visual patterns. 
These features may represent combinations of textures, curves, and parts of objects.`},{t:"code",s:'show_first_8_filters("block5_conv1")',fig:!0},{t:"md",s:`### Observation – conv5_1

The deepest filters produce highly complex and abstract patterns. 
These filters combine simpler features from previous layers and can respond to higher-level visual structures.`},{t:"md",s:`## Discussion

### What do you notice in the different filters?

The filters become more complex as we move deeper into VGG16. Early filters show simple patterns, while deeper filters show more abstract and complicated patterns.

### What kind of information does each filter learn?

The early convolutional layers mainly learn simple features such as edges, colors, and lines.

The middle layers combine these features to detect textures, curves, and shapes.

The deeper layers combine the earlier features into more complex and abstract visual patterns that may represent parts of objects.

Overall, the network learns a hierarchy of visual features:

**Edges and colors → Textures and shapes → Complex and abstract features**`}],s={id:n,title:e,desc:o,file:t,topic:a,cells:r};export{r as cells,s as default,o as desc,t as file,n as id,e as title,a as topic};
