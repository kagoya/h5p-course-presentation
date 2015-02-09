var H5P = H5P || {};
H5P.CoursePresentation = H5P.CoursePresentation || {};

H5P.CoursePresentation.SummarySlide = (function ($) {

  /**
   * Constructor for summary slide
   * @param {H5P.CoursePresentation} coursePresentation Course presentation parent of summary slide
   * @param {$} $summarySlide Summary slide element
   * @constructor
   */
  function SummarySlide(coursePresentation, $summarySlide) {
    // Create summary slide if not an editor
    this.$summarySlide = $summarySlide;
    this.cp = coursePresentation;
    this.$ = $;
  }

  /**
   * Updates the provided summary slide with current values.
   *
   * @param {$} $summarySlide Summary slide that will be updated
   */
  SummarySlide.prototype.updateSummarySlide = function (slideNumber) {
    var that = this;

    // Validate update.
    var isInvalidUpdate = (this.cp.editor === undefined) || (this.$summarySlide !== undefined) || (slideNumber >= this.cp.slides.length - 1);
    if (isInvalidUpdate) {
      return;
    }

    // Remove old content
    this.$summarySlide.children().remove();

    // Enable solution mode
    this.toggleSolutionMode(true);

    // Get scores and updated html for summary slide
    var slideScores = that.cp.showSolutions();
    var htmlText = that.outputScoreStats(slideScores);
    $(htmlText).appendTo(that.$summarySlide);

    // Update feedback icons in solution mode
    this.cp.setProgressBarFeedback(slideScores);

    // Get total scores and construct progress circle
    var totalScores = that.totalScores(slideScores);
    H5P.JoubelUI.createProgressCircle(totalScores.totalPercentage)
      .appendTo($('.h5p-score-message-percentage', that.$summarySlide));

    // Construct facebook share score link
    var $facebookContainer = $('.h5p-summary-facebook-message', that.$summarySlide);
    this.addFacebookScoreLinkTo($facebookContainer, totalScores.totalPercentage);

    // Construct twitter share score link
    var $twitterContainer = $('.h5p-summary-twitter-message', that.$summarySlide);
    this.addTwitterScoreLinkTo($twitterContainer, totalScores.totalPercentage);

    // Update slide links
    var links = that.$summarySlide.find('.h5p-td > a');
    links.each(function () {
      var slideLink = $(this);
      slideLink.click(function (event) {
        that.cp.jumpToSlide(parseInt(slideLink.data('slide'), 10) - 1);
        event.preventDefault();
      });
    });

    // Add button click events
    $('.h5p-show-solutions', that.$summarySlide)
      .click(function (event) {
        that.cp.jumpToSlide(0);
        event.preventDefault();
      });

    $('.h5p-eta-export', that.$summarySlide)
      .click(function (event) {
        H5P.ExportableTextArea.Exporter.run(that.cp.slides, that.cp.elementInstances);
        event.preventDefault();
      });

    $('.h5p-cp-retry-button', that.$summarySlide)
      .click(function (event) {
        that.cp.resetTask();
        event.preventDefault();
      });
  };

  /**
   * Gets html for summary slide.
   *
   * @param slideScores Scores for all pages
   * @returns {string} html
   */
  SummarySlide.prototype.outputScoreStats = function (slideScores) {
    var that = this;
    var totalScore = 0;
    var totalMaxScore = 0;
    var tds = ''; // For saving the main table rows
    var i = 0;
    var slidePercentageScore = 0;
    var slideDescription = '';
    var slideElements;
    var action;
    for (i = 0; i < slideScores.length; i += 1) {
      // Get percentage score for slide
      slidePercentageScore = (slideScores[i].score / slideScores[i].maxscore) * 100;
      if (slideScores[i].score === 0) {
        slidePercentageScore = 0;
      }
      // Get task description, task name or identify multiple tasks:
      slideElements = that.cp.slides[slideScores[i].slide - 1].elements;
      if (slideElements.length > 1) {
        slideDescription = that.cp.l10n.summaryMultipleTaskText;
      } else if (slideElements[0] !== undefined && slideElements[0]) {
        action = slideElements[0].action;
        if (action.params.taskDescription !== undefined && action.params.taskDescription) {
          slideDescription = action.params.taskDescription;
        } else if (action.params.text !== undefined && action.params.text) {
          slideDescription = action.params.text;
        } else if (action.params.intro !== undefined && action.params.intro) {
          slideDescription = action.params.intro;
        } else if (action.library !== undefined && action.library) {
          slideDescription = action.library;
        }
      }

      slidePercentageScore = Math.round((slideScores[i].score / slideScores[i].maxScore) * 100);
      tds += '<tr>' +
              '<td class="h5p-td h5p-summary-task-title">' +
                '<a href="#" class="h5p-slide-link" data-slide="' + slideScores[i].slide + '">' + that.cp.l10n.slide + ' ' + slideScores[i].slide + ': ' + slideDescription + '</a>' +
              '</td>' +
              '<td class="h5p-td h5p-summary-score-bar">' +
                '<div class="h5p-summary-score-meter">' +
                  '<span style="width: ' + slidePercentageScore + '%; opacity: ' + (slidePercentageScore / 100) + '"></span>' +
                '</div>' +
              '</td>' +
            '</tr>';
      totalScore += slideScores[i].score;
      totalMaxScore += slideScores[i].maxScore;
    }

    if (that.cp.postUserStatistics === true) {
      H5P.setFinished(that.cp.contentId, totalScore, totalMaxScore);
    }

    var percentScore = Math.round((totalScore / totalMaxScore) * 100);

    var html =
      '<div class="h5p-score-message">' +
      '<div class="h5p-score-message-percentage">' + that.cp.l10n.scoreMessage + '</div>' +
      '<div class="h5p-summary-facebook-message"></div>' +
      '<div class="h5p-summary-twitter-message"></div>' +
      '</div>' +
      '<div class="h5p-summary-table-holder">' +
      ' <div class="h5p-summary-table-pages">' +
      '   <table class="h5p-score-table">' +
      '     <tbody>' + tds + '</tbody>' +
      '   </table>' +
      ' </div>' +
      ' <table class="h5p-summary-total-table" style="width: 100%">' +
      '    <tr>' +
      '     <td class="h5p-td h5p-summary-task-title">' + that.cp.l10n.total + '</td>' +
      '     <td class="h5p-td h5p-summary-score-bar">' +
      '       <div class="h5p-summary-score-meter">' +
      '         <span style="width: ' + percentScore + '%; opacity: ' + (percentScore / 100) + '"></span>' +
      '       </div>' +
      '     </td>' +
      '   </tr>' +
      ' </table>' +
      '</div>' +
      '<div class="h5p-summary-footer">' +
      ' <button class="h5p-show-solutions">' +  that.cp.l10n.showSolutions + '</button>' +
      ' <button class="h5p-eta-export">' + that.cp.l10n.exportAnswers + '</button>' +
      ' <button class="h5p-cp-retry-button">' + that.cp.l10n.retry + '</button>' +
      '</div>';

    return html;
  };

  /**
   * Adds a link to the given container which will link achieved score to facebook.
   *
   * @param {jQuery} $facebookContainer Container that should hold the facebook link.
   * @param {Number} percentageScore Percentage score that should be linked.
   */
  SummarySlide.prototype.addFacebookScoreLinkTo = function ($facebookContainer, percentageScore) {
    var that = this;
    $('<span class="show-facebook-icon">' + that.cp.l10n.shareFacebook + '</span>')
      .appendTo($facebookContainer);

    var facebookString = 'http://www.facebook.com/dialog/feed?' +
      'app_id=1385640295075628&' +
      'link=http://h5p.org/&' +
      'name=H5P&20task&' +
      'caption=I%20just%20finished%20a%20H5P%20task!&' +
      'description=I%20got%20' + percentageScore + '%25%20at:%20' + window.location.href + '&' +
      'redirect_uri=http://h5p.org/';

    $facebookContainer.click(function () {
      window.open(facebookString);
    });
  };

  /**
   * Adds a link to the given container which will link achieved score to twitter.
   *
   * @param {jQuery} $twitterContainer Container that should hold the twitter link.
   * @param {Number} percentageScore Percentage score that should be linked.
   */
  SummarySlide.prototype.addTwitterScoreLinkTo = function ($twitterContainer, percentageScore) {
    var that = this;
    var twitterString = 'http://twitter.com/share?text=I%20got%20' + percentageScore + '%25%20on%20this%20task:';
    $twitterContainer.click(function () {
      window.open(twitterString);
    });

    $('<span class="show-twitter-icon">' + that.cp.l10n.shareTwitter + '</span>')
      .appendTo($twitterContainer);
  };

  /**
   * Gets total scores for all slides
   * @param {Array} slideScores
   * @returns {{totalScore: number, totalMaxScore: number, totalPercentage: number}} totalScores Total scores object
   */
  SummarySlide.prototype.totalScores = function (slideScores) {
    var totalScore = 0;
    var totalMaxScore = 0;
    var i;
    for (i = 0; i < slideScores.length; i += 1) {
      // Get percentage score for slide
      totalScore += slideScores[i].score;
      totalMaxScore += slideScores[i].maxScore;
    }

    return {
      totalScore: totalScore,
      totalMaxScore: totalMaxScore,
      totalPercentage: Math.round((totalScore / totalMaxScore) * 100)
    };
  };

  /**
   * Toggles solution mode on/off.
   *
   * @params {Boolean} enableSolutionMode Enable/disable solution mode
   */
  SummarySlide.prototype.toggleSolutionMode = function (enableSolutionMode) {
    if (enableSolutionMode) {
      this.cp.$footer.addClass('h5p-footer-solution-mode');
      this.setFooterSolutionModeText(this.cp.l10n.solutionModeText, this.cp.l10n.solutionModeUnderlined);
    } else {
      this.cp.$footer.removeClass('h5p-footer-solution-mode');
      this.setFooterSolutionModeText();
      this.cp.setProgressBarFeedback();
    }
  };

  /**
   * Sets the solution mode button text in footer.
   *
   * @param solutionModeText
   * @param underlinedText
   */
  SummarySlide.prototype.setFooterSolutionModeText = function (solutionModeText, underlinedText) {
    if (solutionModeText !== undefined && solutionModeText) {
      this.cp.$exitSolutionModeText.html(solutionModeText);
    } else {
      this.cp.$exitSolutionModeText.html('');
    }
    if (underlinedText !== undefined && underlinedText) {
      this.cp.$exitSolutionModeUnderlined.html(underlinedText);
    } else {
      this.cp.$exitSolutionModeUnderlined.html('');
    }
  };

  return SummarySlide;
})(H5P.jQuery);