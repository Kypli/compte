// JS IMPORT
import { ucFirst } from '../service/service.js';
import { monnaieStyle } from '../service/service.js';
import { updateTable } from './compte.js';

// CSS
import '../../styles/compte/modalOperation.css';

$(document).ready(function(){

	////////////
	// ON LOAD
	////////////

	var
		_add = '',
		_tboby = '',
		_input_datas = {}
	;

	////////////
	// ON EVENTS
	////////////

	/** Chargement **/

	// Get Operations
	$("body").not('.counterEdit, .td_category_libelle, .td_subcategory_libelle').on("click", ".edit td:not(.counterEdit, .td_category_libelle, .td_subcategory_libelle)", function(e){

		let
			sc_id = $(this).data('scid'),
			sign = $(this).parent().parent().parent().data('sign'),
			month = $(this).data('month'),
			months = $('#datas').data('months'),
			year = $('#datas').data('year')
		;

		getOperationsDatas(sc_id, sign, months, month, year)
	})


	/** Édition **/

	// Add 1 input
	$("body").on("click", "#butOpeAdd", function(e){
		addOpe()
	})

	// Delete add row (cog)
	$("body").on("click", ".deleteAdd", function(e){
		$(this).parent().parent().parent().parent('.tr_add').remove()
		calculSolde()
		checkFormEdit()

		$('#operation_tab').find('tbody .tr_add').length == 0
			? $('#butFullDelAdd').hide()
			: null
	})

	// Delete add row (short button)
	$("body").on("click", ".trButDelAdd", function(e){
		$(this).parent().parent().parent('.tr_add').remove()
		calculSolde()
		checkFormEdit()

		$('#operation_tab').find('.tr_add').length == 0
			? $('#butFullDelAdd').hide()
			: null
	})

	// Delete full add row (Big button)
	$("body").on("click", "#butFullDelAdd", function(e){
		$('.tr_add').remove()
		$('#butFullDelAdd').hide()
		calculSolde()
		checkFormEdit()
	})

	// Delete row
	$("body").on("click", ".delete", function(e){
		let ope_id = $(this).data('opeid')
		$('#ope_id_' + ope_id).remove()
		calculSolde()
		saveMod(true)
	})

	// Reset 1 operation edit
	$("body").on("click", ".trButCancelEdit", function(e){
		resetEdit('ope_id_' + $(this).data('opeid'))
	})

	// Reset all operations edit
	$("body").on("click", "#butFullCancelEdit", function(e){
		resetAllEdit()
	})


	/** Change **/

	// formModFull (Big button)
	$("body").on("click", "#butFullToggleFormMod", function(e){
		$(this).val() == 0
			? formModFull()
			: formModFull(false)
	})

	// Switch
	$("body").on("click", ".switch", function(e){
		toggleInputNumberAnticipe($(this).parent('td').parent('tr'))
		calculSolde()
	})

	// Date + Comment
	$("body").on("input", ".inputDay, .inputComment", function(e){
		checkFormEdit()
	})

	// Toggle divToInput
	$("body").on("click", ".td_number, .td_anticipe, .td_switch, .td_date, .td_comment", function(e){
		toggleInputDiv($(this).parent())
		controlOperation()
		checkFormEdit()
	})

	// Toggle inputToDiv (cog)
	$("body").on("click", ".noForm", function(e){
		if (!$(this).hasClass('invalid')){
			toggleInputDiv($(this).parent().parent().parent().parent(), false)
		}
		controlOperation()
		checkFormEdit()
	})

	// Toggle inputToDiv (short button)
	$("body").on("click", ".trButStopFormMod", function(e){
		toggleInputDiv($(this).parent().parent().parent(), false)
		controlOperation()
		checkFormEdit()
	})

	// Input monnaie Style inputToDiv
	$("body").on("input", ".inputNumber, .inputAnticipe", function(e){
		$(this).val(monnaieStyle($(this).val()))
	})


	/** Save **/

	// Save
	$("body").on("click", "#modalOperationSaveClose", function(e){
		sauvegarde()
	})

	// Control + calcul
	$("body").on("input", ".inputNumber, .inputAnticipe", function(e){
		controlOperation()
		calculSolde()
		checkFormEdit()
	})
	$("body").on("click", ".deleteAdd, #butOpeAdd, .delete", function(e){
		controlOperation()
		calculSolde()
	})


	////////////
	// FONCTIONS
	////////////

	/** Chargement **/

	function getOperationsDatas(sc_id, sign, months, month, year){

		$.ajax({
			type: "POST",
			url: Routing.generate('compte_operation', { sc: sc_id, year: year, month: month, sign: sign }),
			timeout: 15000,
			beforeSend: function(){
				saveMod(false)
				meta1(year, months[month])
				spinner(true)
				$('#butFullCancelEdit, #butFullDelAdd, #butFullRevive').hide()
			},
			success: function(response){

				_add = response.addRender
				_tboby = response.tBodyRender

				meta2(response.category_libelle, response.subcategory_libelle, sign)
				showTbody(_tboby, year, month, response.days_in_month, sc_id, sign)

				response.operations.length == 0
					? $('#butFullToggleFormMod').prop('disabled', true) && addOpe()
					: $('#butFullToggleFormMod').prop('disabled', false)

				spinner(false)
				getInputDatas()
			},
			error: function(error){
				console.log('Erreur ajax: ' + error)
				spinner(false)
			}
		})
	}

	// Toggle spinner
	function spinner(etat){
		if (etat){
			$('.spinner').show()

		} else {
			$('.spinner').hide()
		}
	}

	// Clean Text header + body
	function meta1(year, month){

		// HEAD DATE
		$('#date_annee').text(year)
		$('#date_mois').text(ucFirst(month))

		// HEAD LIBELLE + COLOR
		$('#category').text('.............')
		$('#subcategory').text('.............')
		$('#category, #subcategory, #solde').removeClass("total_month_full_pos").removeClass("total_month_full_neg")

		// BODY
		$('#operation_tab tbody tr').not('#tr_solde, #solde_tr_collabo').remove()
		$('#tr_solde').hide()
		$('#solde').text('0').hide()
		formModFull(false)
	}

	// Text header + show body
	function meta2(cat_libelle, subcat_libelle, sign){

		// HEAD LIBELLE
		$('#category').text(ucFirst(cat_libelle))
		$('#subcategory').text(ucFirst(subcat_libelle))
		$('#solde, #tr_solde').show()
		sign = sign == 1 ? 'pos' : 'neg'
		$('#category, #subcategory, #solde').addClass('total_month_full_' + sign)
	}

	// Show Tbody
	function showTbody(render, year, month, daysInMonth, sc_id, sign){

		// Update tbody
		$('#operation_tab tbody')
			.data('year', year)
			.data('month', month)
			.data('daysinmonth', daysInMonth)
			.data('scid', sc_id)
			.data('sign', sign)
		;

		// Clean Tbody
		$('#operation_tab tbody tr')
			.not('#tr_solde, #solde_tr_collabo')
			.remove()
		;

		$('#operation_tab tbody').append(render)
		$('#solde_tr_collabo').insertAfter('#operation_tab tbody tr:last')
		$('#tr_solde').insertAfter('#operation_tab tbody tr:last')
		calculSolde()
	}

	// Récupère les datas des input pour control édition
	function getInputDatas(){

		// Reset
		_input_datas = {}

		// Number + Anticipe
		$('#operation_tab .tr_ope').each(function(index, div){
			let id = div.id
			_input_datas[id+'_number'] = $('#' + id + ' .td_number').text().trim()
			_input_datas[id+'_anticipe'] = $('#' + id + ' .td_anticipe').text().trim()
			_input_datas[id+'_date'] = $('#' + id + ' .td_date').text().substring(0, 2).trim()
			_input_datas[id+'_comment'] = $('#' + id + ' .td_comment').text().trim()
		})
	}


	/** Add **/

	// Add 1 operation
	function addOpe(){
		$('#operation_tab tbody').append(_add)
		$('#solde_tr_collabo').insertAfter('#operation_tab tbody tr:last')
		$('#tr_solde').insertAfter('#operation_tab tbody tr:last')
		saveMod(true)
		$('#butFullDelAdd').show()
	}


	/** Change **/

	// Toggle input Number <-> Anticipe
	function toggleInputNumberAnticipe(tr){
		let
			input = tr.find('input'),
			val = monnaieStyle(input.val()),
			clas = input.attr('class')
		;

		// Add anticipe
		if (clas.indexOf("inputNumber") == 0){
			tr.find('.td_anticipe').append("<input class='inputAnticipe' type='number' step='0.01' value='"+val+"' min='0' />")
			tr.find('.td_number').empty()

		// Add number
		} else if(clas.indexOf("inputAnticipe") == 0){
			tr.find('.td_number').append("<input class='inputNumber' type='number' step='0.01' value='"+val+"' min='0' />")
			tr.find('.td_anticipe').empty()
		}
	}

	// Reset 1 operation
	function resetEdit(id){

		let 
			number = _input_datas[id + '_number'],
			anticipe = _input_datas[id + '_anticipe'],
			date_text = _input_datas[id + '_date'],
			date = date_text < 10 ? date_text.substring(1) : date_text,
			input_number = "<input class='inputNumber' type='number' step='0.01' value='" + number + "' min='0' />",
			input_anticipe = "<input class='inputAnticipe' type='number' step='0.01' value='" + anticipe + "' min='0' />"
		;

		// Number
		if (number != ''){
			$('#' + id + ' .inputNumber').length == 1
				? $('#' + id + ' .inputNumber').val(number)
				: $('#' + id + ' .td_number').append(input_number) && $('#' + id + ' .td_anticipe').empty()

		// Anticipe
		} else {
			$('#' + id + ' .inputAnticipe').length == 1
				? $('#' + id + ' .inputAnticipe').val(anticipe)
				: $('#' + id + ' .td_anticipe').append(input_anticipe) && $('#' + id + ' .td_number').empty()
		}

		// Date
		$('#' + id + ' .inputDay option[value="'+ date +'"]').prop('selected', true)

		// Comment
		$('#' + id + ' .inputComment').val(_input_datas[id + '_comment'])

		checkFormEdit()
	}

	// Reset all Edit operations
	function resetAllEdit(){

		$('#butFullCancelEdit').hide().prop('disabled', true)

		$('#operation_tab .tr_edit').each(function(index, div){

			let 
				id = div.id,
				date = _input_datas[id + '_date'],
				number = _input_datas[id + '_number'],
				anticipe = _input_datas[id + '_anticipe'],
				input_number = "<input class='inputNumber' type='number' step='0.01' value='" + number + "' min='0' />",
				input_anticipe = "<input class='inputAnticipe' type='number' step='0.01' value='" + anticipe + "' min='0' />",
				tr_formMod = $('#' + id + ' .td_date').find('.inputDay').length == 1 ? true : false
			;

			// FormMod
			if (tr_formMod){

				// Number
				if (number != ''){
					$('#' + id + ' .inputNumber').length == 1
						? $('#' + id + ' .inputNumber').val(number)
						: $('#' + id + ' .td_number').append(input_number) && $('#' + id + ' .td_anticipe').empty()

				// Anticipe
				} else {
					$('#' + id + ' .inputAnticipe').length == 1
						? $('#' + id + ' .inputAnticipe').val(anticipe)
						: $('#' + id + ' .td_anticipe').append(input_anticipe) && $('#' + id + ' .td_number').empty()
				}

				// Date
				date = date < 10 ? date.substring(1) : date,
				$('#' + id + ' .inputDay option[value="'+ date +'"]').prop('selected', true)

				// Comment
				$('#' + id + ' .inputComment').val(_input_datas[id + '_comment'])

			// No FormMod
			} else {

				// Number + Anticipe
				$('#' + id + ' .td_number, #' + id + ' .td_anticipe').empty()
				number != ''
					? $('#' + id + ' .td_number').append(number)
					: $('#' + id + ' .td_anticipe').append(anticipe)

				// Date
				$('#' + id + ' .td_date .day').text(date)

				// Comment
				$('#' + id + ' .td_comment').text(_input_datas[id + '_comment'])
			}
		})

		checkFormEdit()
	}

	// Mise à jour du solde
	function calculSolde(){

		let
			sign = $('#operation_tab tbody').data('sign'),
			counterSign = sign == 'pos' ? 'neg' : 'pos',
			solde_fait = 0,
			solde_anticipe = 0
		;

		// Sous-total
		$(".td_number").each(function(index, value){
			if ($(this).is(":visible")){

				let val = $(this).find('.inputNumber').val()

				solde_fait = val != undefined && val != ''
					? solde_fait + parseFloat(val)
					: $(this).text().trim() != ''
						? solde_fait + parseFloat($(this).text())
						: solde_fait
			}
		})

		$(".td_anticipe").each(function(index, value){
			if ($(this).is(":visible")){

				let val = $(this).find('.inputAnticipe').val()

				solde_anticipe = val != undefined && val != ''
					? solde_anticipe + parseFloat(val)
					: $(this).text().trim() != ''
						? solde_anticipe + parseFloat($(this).text())
						: solde_anticipe
			}
		})

		// Math
		solde_fait = Math.round((solde_fait)*100)/100
		solde_anticipe = Math.round((solde_anticipe)*100)/100

		solde_fait = correctNumber(solde_fait)
		solde_anticipe = correctNumber(solde_anticipe)

		$('#soldeReel').text(solde_fait)
		$('#soldeAnticipe').text(solde_anticipe)
		$('#solde').text(Math.round((parseFloat(solde_fait) + parseFloat(solde_anticipe))*100)/100)

		// Color Reel
		$('#soldeReel').addClass('total_month_detail_'+ sign).removeClass('total_month_detail_' + counterSign)
	}


	/** Form mod **/

	// All FormMode
	function formModFull(etat = true){
		$(".tr_ope, .tr_add").each(function(index, value){
			toggleInputDiv($(this), etat)
		})
		controlOperation()
		checkFormEdit()		
	}

	// Check Si formMod + Edit + SaveMod (Alerte visuelle)
	function checkFormEdit(isSaveMod = false){

		// isSaveMod true si addMod
		if ($('body #operation_tab .tr_add').length > 0){
			isSaveMod = true
		}

		// Hide butFullCancelEdit
		$('#butFullCancelEdit').hide().prop('disabled', true)

		// Check Number + Anticipe
		$('#operation_tab .tr_ope').each(function(index, div){

			let 
				id = div.id,

				input_number = $('#' + id + ' .inputNumber'),
				input_anticipe = $('#' + id + ' .inputAnticipe'),
				input_date = $('#' + id + ' .inputDay'),
				input_comment = $('#' + id + ' .inputComment'),

				td_number = $('#' + id + ' .td_number'),
				td_anticipe = $('#' + id + ' .td_anticipe'),
				td_date = $('#' + id + ' .td_date'),
				td_date_day = $('#' + id + ' .td_date .day'),
				td_comment = $('#' + id + ' .td_comment'),

				tr_edit = false,
				tr_formMod = input_date.length == 1
					? true
					: false,

				number = input_number.length == 1
					? input_number.val()
					: $('#' + id + ' .td_number').text().trim(),
				anticipe = input_anticipe.length == 1
					? input_anticipe.val()
					: $('#' + id + ' .td_anticipe').text().trim(),
				date = tr_formMod
					? input_date.val() < 10
						? '0' + input_date.val()
						: input_date.val()
					: $('#' + id + ' .td_date').text().substring(0, 2).trim(),
				comment = tr_formMod
					? input_comment.val()
					: $('#' + id + ' .td_comment').text().trim()
			;

			// Correct Number
			if (_input_datas[id + '_number'] != number){
				tr_edit = true

				_input_datas[id + '_number'] == ''
					? input_number.addClass('input_edit') && td_number.addClass('input_edit_val')
					: input_number.removeClass('input_edit') && td_number.removeClass('input_edit_val')

				number != _input_datas[id + '_anticipe']
					? input_number.addClass('input_edit_val') && td_number.addClass('input_edit_val')
					: input_number.removeClass('input_edit_val') && td_number.removeClass('input_edit_val')
			} else {
				input_number.removeClass('input_edit')
				input_number.removeClass('input_edit_val')
				td_number.removeClass('input_edit_val')
			}

			// Correct Anticipe
			if (_input_datas[id + '_anticipe'] != anticipe){
				tr_edit = true

				_input_datas[id + '_anticipe'] == ''
					? input_anticipe.addClass('input_edit') && td_anticipe.addClass('input_edit_val_bis')
					: input_anticipe.removeClass('input_edit') && td_anticipe.removeClass('input_edit_val_bis')

				anticipe != _input_datas[id + '_number']
					? input_anticipe.addClass('input_edit_val_bis') && td_anticipe.addClass('input_edit_val_bis')
					: input_anticipe.removeClass('input_edit_val_bis') && td_anticipe.removeClass('input_edit_val_bis')
			} else {
				input_anticipe.removeClass('input_edit')
				input_anticipe.removeClass('input_edit_val_bis')
				td_anticipe.removeClass('input_edit_val_bis')
			}

			// Date
			if (_input_datas[id + '_date'] != date){
				tr_edit = true
				input_date.addClass('input_edit_val')
				td_date_day.addClass('input_edit_val')
			} else {
				input_date.removeClass('input_edit_val')
				td_date_day.removeClass('input_edit_val')
			}

			// Comment
			if (_input_datas[id + '_comment'] != comment){
				tr_edit = true
				input_comment.addClass('input_edit_val')
				td_comment.addClass('input_edit_val')
			} else {
				input_comment.removeClass('input_edit_val')
				td_comment.removeClass('input_edit_val')
			}

			// trButStopFormMod ?
			tr_formMod && !tr_edit
				? $('#' + id + ' .trButStopFormMod').show()
				: $('#' + id + ' .trButStopFormMod').hide()

			// trButCancelEdit ?
			tr_edit && tr_formMod
				? $('#' + id + ' .trButCancelEdit').show()
				: $('#' + id + ' .trButCancelEdit').hide()

			// tr_edit + butFullCancelEdit ?
			tr_edit
				? isSaveMod = true && $(this).addClass('tr_edit') && $('#butFullCancelEdit').show().prop('disabled', false)
				: $(this).removeClass('tr_edit')
		})

		// Check EditMod
		saveMod(isSaveMod)
	}

	// Toggle form <-> noForm
	function toggleInputDiv(tr, divToInput = true){

		// Stop si ajout non défini
		if (tr.hasClass('tr_add') && tr.find('.inputNumber').length > 0 && tr.find('.inputAnticipe').length > 0){ return false }

		// Div -> Input
		if (divToInput){

			// Stop si déja visible
			if (tr.find('.inputComment').length > 0){ return false }

			let 
				daysInMonth = $('#operation_tab tbody').data('daysinmonth'),

				td_number = tr.find('.td_number'),
				td_anticipe = tr.find('.td_anticipe'),
				td_date = tr.find('.td_date'),
				td_comment = tr.find('.td_comment'),

				number = td_number.text().trim(),
				anticipe = td_anticipe.text().trim(),
				date = td_date.text().split('/'),
				comment = td_comment.text().trim(),

				input_number = "<input class='inputNumber' type='number' step='0.01' value='" + number + "' min='0' />",
				input_anticipe = "<input class='inputAnticipe' type='number' step='0.01' value='" + anticipe + "' min='0' />",
				input_date = "<span class='day'><select class='inputDay'/>",
				input_comment = "<input class='inputComment' type='text' value='" + comment + "' />"
			;

			// Switch + Actions
			tr.find('.switch, .btn-group').prop('disabled', false).show()

			// Noform
			tr.find('.btn-group .noForm').removeClass('invalid')

			// Number
			if (number != ''){ td_number.empty().append(input_number) }

			// Anticipe
			if (anticipe != ''){ td_anticipe.empty().append(input_anticipe) }

			// Date
			for (var i = 1; i <= daysInMonth; i++){

				let loopFirst = i == date[0]
					? 'selected'
					: ''

				input_date = input_date + "<option value='" + i + "' " + loopFirst + ">" + i + "</option>"
			}
			input_date = input_date + "</select></span>/"+ date[1] + "/" + date[2]
			td_date.empty().append(input_date)

			// Comment
			td_comment.empty().append(input_comment)

			// Button Edit
			tr.hasClass('tr_edit')
				? tr.find('.trButCancelEdit').show() && tr.find('.trButStopFormMod').hide()
				: tr.find('.trButStopFormMod').show()

		// Input -> Div
		} else {

			// Stop si déja visible
			if (tr.find('.inputComment').length == 0){ return false }

			let
				inputNumber = tr.find('.inputNumber'),
				inputAnticipe = tr.find('.inputAnticipe'),
				inputNumberVal = inputNumber.val() == null ? '' : correctNumber(inputNumber.val()),
				inputAnticipeVal = inputAnticipe.val() == null ? '' : correctNumber(inputAnticipe.val()),
				inputDay = tr.find('.inputDay'),
				inputComment = tr.find('.inputComment'),
				day = inputDay.val()
			;

			// Switch + Action
			tr.find('.switch, .btn-group').prop('disabled', true).hide()

			inputNumber.after(inputNumberVal).remove()
			inputAnticipe.after(inputAnticipeVal).remove()
			inputDay.after(day < 10 ? '0'+ day : day).remove()
			inputComment.after(inputComment.val()).remove()
		}
	}


	/** Utilitaire **/

	// Renvoie un nombre avec 2 chiffres après la virgule
	function correctNumber(number){
		return parseFloat(number) % 1 == 0
			? parseFloat(number)
			: parseFloat(number).toFixed(2)
	}


	/** Sauvegarde **/

	// Mode save
	function saveMod(etat){

		// ON
		if (etat){
			$('.modal-footer').show()
			$('#modalOperationSaveClose').prop('disabled', false).show()
			$('#modalOperationClose').prop('title', 'Fermer la fenêtre sans enregistrer').text('Fermer sans enregistrer')

		// OFF
		} else {
			$('.tr_add').remove()
			$('#modalOperationSaveClose').prop('disabled', true).hide()
			$('#saveAdd, .deleteAdd').prop('disabled', true).hide()
			$('#close').prop('disabled', false).prop('title', 'Fermer la fenêtre')
			$('.modal-footer').hide()
			$('#modalOperationClose').prop('title', 'Fermer la fenêtre').text('Fermer')
			calculSolde()
		}
	}

	function controlOperation(){

		let
			control = true,
			checkChange = false
		;

		$("#operation_tab tbody tr").not('#solde_tr_collabo, #tr_solde').each(function(index, value){

			let
				switch_icon = $(this).find('.switch'),
				input_number = $(this).find('.inputNumber'),
				input_anticipe = $(this).find('.inputAnticipe'),
				input_number_val = input_number.val(),
				input_anticipe_val = input_anticipe.val()
			;

			// 2 Input existants
			if (input_number_val != undefined && input_anticipe_val != undefined){

				let input_number_valid = input_number_val == '' || input_number_val == '0' || input_number_val == 0
					? false
					: true

				let input_anticipe_valid = input_anticipe_val == '' || input_anticipe_val == '0' || input_anticipe_val == 0
					? false
					: true

				// 2 vides
				if (!input_number_valid && !input_anticipe_valid){
					input_number.addClass('alerteOpe').removeClass('alerte-doublon')
					input_anticipe.addClass('alerteOpe').removeClass('alerte-doublon')
					control = false

				// 2 remplis (ne doit plus apparaitre)
				} else if(input_number_valid && input_anticipe_valid){
					input_number.addClass('alerte-doublon').removeClass('alerteOpe')
					input_anticipe.addClass('alerte-doublon').removeClass('alerteOpe')
					control = false

				// 1 rempli et 1 vide
				} else {
					switch_icon.show()
					$(this).find('.noForm').removeClass('invalid')
					input_number_valid
						? input_anticipe.remove() && input_number.removeClass('alerteOpe').removeClass('alerte-doublon')
						: input_number.remove() && input_anticipe.removeClass('alerteOpe').removeClass('alerte-doublon')
				}

			// Only Number valid
			} else if(input_number_val != undefined && input_anticipe_val == undefined){

				let input_number_valid = input_number_val == '' || input_number_val == '0' || input_number_val == 0
					? false
					: true

				if (input_number_valid){
					input_number.removeClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.show()
				} else {
					input_number.addClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.hide()
					$("#operation_tab tbody .alerteOpe:first").focus()
					control = false
				}
				checkChange = true

			// Only Anticipe valid
			} else if(input_number_val == undefined && input_anticipe_val != undefined){

				let input_anticipe_valid = input_anticipe_val == '' || input_anticipe_val == '0' || input_anticipe_val == 0
					? false
					: true

				if (input_anticipe_valid){
					input_anticipe.removeClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.show()
				} else {
					input_anticipe.addClass('alerteOpe').removeClass('alerte-doublon')
					switch_icon.hide()
					$("#operation_tab tbody .alerteOpe:first").focus()
					control = false
				}
				checkChange = true
			}
		})

		// Button Statut
		checkChange
			? $('#butFullToggleFormMod').val(1).html("<i class='fas fa-times' title='Retirer les formulaires des lignes'></i>")
			: $('#butFullToggleFormMod').val(0).html("<i class='fas fa-edit'></i>")

		return control
	}

	function sauvegarde(){

		let
			datas = [],
			sc_id = $('#operation_tab tbody').data('scid'),
			month = $('#operation_tab tbody').data('month'),
			year = $('#operation_tab tbody').data('year'),
			sign = $('#operation_tab tbody').data('sign')
		;

		$("#operation_tab tbody tr").not('#solde_tr_collabo, #tr_solde').each(function(index, value){

			let
				id_array = value.id.split('_'),
				id = id_array[2] ? id_array[2] : null,
				number = $(this).find('.inputNumber').val() == undefined ? $(this).find('.td_number').text() : parseFloat($(this).find('.inputNumber').val()).toFixed(2),
				number_anticipe = $(this).find('.inputAnticipe').val() == undefined ? $(this).find('.td_anticipe').text() : parseFloat($(this).find('.inputAnticipe').val()).toFixed(2),
				day = $(this).find('.inputDay').val() == undefined ? $(this).find('.td_date').text().substring(0, 2) : $(this).find('.inputDay').val(),
				comment = $(this).find('.inputComment').val() == undefined ? $(this).find('.td_comment').text() : $(this).find('.inputComment').val()
			;

			if (number != null || number_anticipe != null){
				datas.push({
					id: id,
					number: number,
					number_anticipe: number_anticipe,
					day: day,
					month: month,
					year: year,
					comment: comment,
				})
			}
		})

		$.ajax({
			type: "POST",
			url: Routing.generate('compte_operation_save', { sc: sc_id, year: year, month: month, sign: sign }),
			data: { datas: datas },
			dataType: 'JSON',
			timeout: 15000,
			beforeSend: function(){

			},
			success: function(response){
				updateTable()
			},
			error: function(error){
				console.log('Erreur ajax: ' + error)
			}
		})
	}
})