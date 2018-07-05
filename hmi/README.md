
# Webapp development principles

The webapp development is based on 2 main ideas:
- components (thereafter we use rather the word control)
- services

A control may need one or severals services to work which themselves may need over services to work.

![controls&services](https://user-images.githubusercontent.com/27694866/42309800-f384a64c-8039-11e8-9b7a-fb222c886928.png)

## Controls

Controls are javascript code whose goal is to manage a part of the HTML DOM.

In theory a webapp should consist of one main control which itself consists of one or severals controls.

![mainctrl](https://user-images.githubusercontent.com/27694866/42309859-2928e10a-803a-11e8-825a-0fa97223f5c5.png)

## Services

Services are javascript object which are instanciated automatically by the framework when first needed.

Services may be configured at webapp startup in the **configReady** function before any controls creation.

