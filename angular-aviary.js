/*
	angular-aviary v0.6.0
	(c) 2016 Massimiliano Sartoretto <massimilianosartoretto@gmail.com>
	License: MIT
*/

'format amd';
/* global define */

(function() {
    'use strict';

    function ngAviary(angular, Aviary) {

        ngAviaryDirective.$inject = ['ngAviary', 'ngAviaryService'];

        function ngAviaryDirective(ngAviary, ngAviaryService) {
            return {
                restrict: 'A',
                scope: {
                    targetSelector: '@',
                    targetSrc: '@',
                    onSave: '&',
                    onSaveButtonClicked: '&',
                    onClose: '&'
                },
                link: function(scope, element, attrs) {
                    var featherEditor = null;

                    element.bind('click', function(e) {
                        e.preventDefault();

                        featherEditor = ngAviaryService.launchEditor(scope.targetSelector, {
                            targetSrc: scope.targetSrc,
                            onSave: scope.onSave,
                            onSaveButtonClicked: function(imageId, canvas, featherEditor) {
                                return scope.onSaveButtonClicked({ id: imageId, canvas: canvas, featherEditor: featherEditor });
                            },
                            onClose: function(isDirty) {
                                return scope.onClose({ isDirty: isDirty })
                            }
                        });

                        return false;
                    });
                }
            };
        }

        ngAviaryService.$inject = ['ngAviary'];

        function ngAviaryService(ngAviary) {
            /* jshint validthis:true */

            var featherEditor = null;
            var isLoaded = false;

            var setupCallbacks = function(options) {
                var onSaveButtonClickedCb = function(imageId) {
                    var canvasId = ngAviary.configuration.adobeCanvasSelector || '#avpw_canvas_element';
                    var canvas = angular.element(document.querySelector(canvasId))[0];
                    return (options.onSaveButtonClicked || angular.noop)(imageId, canvas, featherEditor);
                };

                var onSaveCb = function(imageID, newURL) {
                    (options.onSave || angular.noop)({
                        id: imageID,
                        newURL: newURL
                    });

                    if (options.closeOnSave || ngAviary.configuration.closeOnSave) {
                        featherEditor.close();
                    }
                };

                var onErrorCb = function(errorObj) {
                    (options.onError || angular.noop)(errorObj);
                };

                var onCloseCb = function(isDirty) {
                    (options.onClose || angular.noop)(isDirty);
                };

                return {
                    onSaveButtonClicked: onSaveButtonClickedCb,
                    onSave: onSaveCb,
                    onError: onErrorCb,
                    onClose: onCloseCb
                };
            };

            this.launchEditor = function(domId, options) {
                var launchConfigs = setupCallbacks(options);
                launchConfigs.onLoad = function() {
                    var targetImage = window.document.querySelector(domId);
                    featherEditor.launch({
                        image: targetImage,
                        url: options.targetSrc || targetImage.src
                    });
                };

                if (!isLoaded) {
                    featherEditor = new Aviary.Feather(
                        angular.extend({}, ngAviary.configuration, launchConfigs)
                    );
                    isLoaded = true;
                } else {
                    var targetImage = window.document.querySelector(domId);
                    featherEditor.updateConfig(angular.extend({}, ngAviary.configuration, launchConfigs));
                    featherEditor.launch({
                        image: targetImage,
                        url: options.targetSrc || targetImage.src
                    });
                }

                return featherEditor;
            };

            this.closeEditor = function() {
                if (featherEditor) {
                    featherEditor.close();
                }
            };
        }

        function ngAviaryProvider() {
            /* jshint validthis:true */

            var defaults = {
                apiKey: null
            };

            var requiredKeys = [
                'apiKey'
            ];

            var config;

            this.configure = function(params) {
                // Can only be configured once
                if (config) {
                    throw new Error('Already configured.');
                }

                // Check if it is an `object`
                if (!(params instanceof Object)) {
                    throw new TypeError('Invalid argument: `config` must be an `Object`.');
                }

                // Extend default configuration
                config = angular.extend({}, defaults, params);

                // Check if all required keys are set
                angular.forEach(requiredKeys, function(key) {
                    if (!config[key]) {
                        throw new Error('Missing parameter:', key);
                    }
                });

                return config;
            };

            this.$get = function() {
                if (!config) {
                    throw new Error('ngAviary must be configured first.');
                }

                var getConfig = (function() {
                    return config;
                })();

                return {
                    configuration: getConfig
                };
            };
        }

        return angular
            .module('ngAviary', [])
            .directive('ngAviary', ngAviaryDirective)
            .provider('ngAviary', ngAviaryProvider)
            .service('ngAviaryService', ngAviaryService);
    }

    if (typeof define === 'function' && define.amd) {
        define(['angular', 'Aviary'], ngAviary);
    } else if (typeof module !== 'undefined' && module && module.exports) {
        ngAviary(angular, require('Aviary'));
        module.exports = 'ngAviary';
    } else {
        ngAviary(angular, (typeof global !== 'undefined' ? global : window).Aviary);
    }
})();