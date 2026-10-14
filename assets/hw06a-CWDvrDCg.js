const _="hw06a",n="HW06 Part A",e="Keras ResNet50 base model",o="HW-6PART-A.ipynb",t="keras",s=[{t:"md",s:`# HW-6
## name - Amrinder Singh`},{t:"code",s:`import tensorflow as tf
from tensorflow.keras.applications import ResNet50`},{t:"code",s:`base_model = ResNet50(
    weights="imagenet",        # use the pre-trained ImageNet weights
    include_top=False,         # remove the original 1,000-class output layer
    input_shape=(224, 224, 3)  # standard ResNet50 image size
)`,o:`Downloading data from https://storage.googleapis.com/tensorflow/keras-applications/resnet/resnet50_weights_tf_dim_ordering_tf_kernels_notop.h5
94765736/94765736 [==============================] - 2s 0us/step`},{t:"code",s:"base_model.summary()",o:`Model: "resnet50"
__________________________________________________________________________________________________
 Layer (type)                   Output Shape         Param #     Connected to                     
==================================================================================================
 input_1 (InputLayer)           [(None, 224, 224, 3  0           []                               
                                )]                                                                
 conv1_pad (ZeroPadding2D)      (None, 230, 230, 3)  0           ['input_1[0][0]']                
 conv1_conv (Conv2D)            (None, 112, 112, 64  9472        ['conv1_pad[0][0]']              
                                )                                                                 
 conv1_bn (BatchNormalization)  (None, 112, 112, 64  256         ['conv1_conv[0][0]']             
                                )                                                                 
 conv1_relu (Activation)        (None, 112, 112, 64  0           ['conv1_bn[0][0]']               
                                )                                                                 
 pool1_pad (ZeroPadding2D)      (None, 114, 114, 64  0           ['conv1_relu[0][0]']             
                                )                                                                 
 pool1_pool (MaxPooling2D)      (None, 56, 56, 64)   0           ['pool1_pad[0][0]']
...`}],a={id:_,title:n,desc:e,file:o,topic:t,cells:s};export{s as cells,a as default,e as desc,o as file,_ as id,n as title,t as topic};
